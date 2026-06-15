import { degToRad } from "three/src/math/MathUtils.js";
import { actionsPanel, room, state, three } from "../../store/globalState";
import { activeHandleMaterial, basicHandleMaterial } from "../../store/meterials";
import { Vector2, Vector3, Plane, Mesh, Shape, ShapeGeometry, PlaneGeometry } from "three";
import { createEdges } from "../setup";


const originalStartVertex = new Vector2();
const originalEndVertex = new Vector2();
const dragPlane = new Plane(new Vector3(0, 0, 1), 0);
const dragStart = new Vector3();


function handleActionPanel(event : Event){
    const target = event.target as HTMLElement;

    if(!actionsPanel.contains(target) && target != actionsPanel){
        actionsPanel.style.display = 'none';
        state.isActionsPanelActive = false;
        for (let i = 0; i < room.edges.length; i++) {
            room.edgeHandles[i].material = basicHandleMaterial;
        }
        room.edgeToMove = null;
    }
}

export function mouseDown(event: MouseEvent){
    state.timerStart = Date.now();

    if(state.isActionsPanelActive){
        handleActionPanel(event);
    } else{
        room.edgeToMove = null;
        for (let i = 0; i < room.edges.length; i++) {
            room.edgeHandles[i].material = basicHandleMaterial;
        }
    }
    
    
    three.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    three.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);
    const intersects = three.raycaster.intersectObjects(three.scene.children);

    if(intersects.length > 0){
        const clickedType = intersects[0].object.userData.type;

        if(clickedType == 'vertex'){
            room.verticesHandles.forEach((vertexHandle, index) => {
                if(vertexHandle.userData.id == intersects[0].object.userData.id){
                    three.raycaster.ray.intersectPlane(dragPlane, dragStart);
            
                    originalStartVertex.copy(room.vertices[index]);
            
                    three.controls.enablePan = false;
                    state.isDragging = true;
                    room.vertexToMove = index;
                }
            });
        }else if(clickedType == 'edge'){
            room.edges.forEach(edge => {
                if(edge.id === intersects[0].object.userData.id){
                    
                    three.raycaster.ray.intersectPlane(dragPlane, dragStart);

                    originalStartVertex.copy(room.vertices[edge.startIndex]);
                    originalEndVertex.copy(room.vertices[edge.endIndex]);

                    three.controls.enablePan = false;
                    state.isDragging = true;
                    room.edgeToMove = edge;

                    room.edgeHandles[room.edgeToMove.handle!].material = activeHandleMaterial;
                }
            });
        }
    }
}


export function mouseMove(event: MouseEvent, floor: Mesh){

    three.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    three.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const intersections = three.raycaster.intersectObjects([...room.edgeHandles, ...room.verticesHandles]);

    if(intersections.length > 0){
        const intersectionType = intersections[0].object.userData.type;
        const handleId = intersections[0].object.userData.id;

        if(intersectionType == 'vertex'){
            document.body.style.cursor = 'all-scroll';
        }else{
            if(room.edges[handleId].direction === 'x'){
                document.body.style.cursor = 'col-resize';
            }else if(room.edges[handleId].direction === 'y'){
                document.body.style.cursor = 'row-resize';
            }
        }
    }else{
        document.body.style.cursor = 'default';
    }


    if(!state.isDragging)return

    const point = new Vector3();

    three.raycaster!.ray.intersectPlane(
        dragPlane,
        point
    );

    if(room.edgeToMove && !room.vertexToMove){
    if(room.edgeToMove?.direction == 'x'){
        const deltaX = point.x - dragStart.x;
    
        room.vertices[room.edgeToMove!.startIndex].x = originalStartVertex.x + deltaX;
        room.vertices[room.edgeToMove!.endIndex].x = originalEndVertex.x + deltaX;
    }else if(room.edgeToMove?.direction == 'y'){
        const deltaY = point.y - dragStart.y;
    
        room.vertices[room.edgeToMove!.startIndex].y = originalStartVertex.y + deltaY;
        room.vertices[room.edgeToMove!.endIndex].y = originalEndVertex.y + deltaY;
    }
    
    room.verticesHandles[room.edgeToMove.startIndex].position.x = room.vertices[room.edgeToMove.startIndex].x;
    room.verticesHandles[room.edgeToMove.startIndex].position.y = room.vertices[room.edgeToMove.startIndex].y;
    room.verticesHandles[room.edgeToMove.endIndex].position.x = room.vertices[room.edgeToMove.endIndex].x;
    room.verticesHandles[room.edgeToMove.endIndex].position.y = room.vertices[room.edgeToMove.endIndex].y;

    }else if((room.vertexToMove || room.vertexToMove === 0) && !room.edgeToMove){
        const deltaX = point.x - dragStart.x;
        const deltaY = point.y - dragStart.y;

        room.vertices[room.vertexToMove].x = originalStartVertex.x + deltaX;
        room.vertices[room.vertexToMove].y = originalStartVertex.y + deltaY;
    }
    // Recreate floor with new vertices coordinates
    rebuildRoomFloor(floor, room.vertexToMove);
}



export function mouseUp(){
    const endClick = Date.now();
    
    // It's a click
    if(endClick - state.timerStart < 250){
        // Activate actionsPanel panel
        if(room.edgeToMove && state.isActionsPanelActive === false){
            actionsPanel.style.display = 'flex';
            state.isActionsPanelActive = true;
        }
    }

    three.controls!.enablePan = true;
    state.isDragging = false;
    room.vertexToMove = null;
    document.body.style.cursor = 'default';

    if(!state.isActionsPanelActive){
        if(room.edgeToMove) room.edgeHandles[room.edgeToMove.handle!].material = basicHandleMaterial;
    }
}


/**
 * 
 * @param floor 
 * @param vertexToMove 
 */
export function rebuildRoomFloor(floor: Mesh, vertexToMove: number | null){

    // Floor Geometry
    const newShape = new Shape(room.vertices);
    const newFloorGeometry = new ShapeGeometry(newShape);
    floor.geometry.dispose();


    createEdges();  

    room.edges.forEach((edge, index) => {
        edge.handle = index;
    
        const v1 = room.vertices[edge.startIndex];
        const v2 = room.vertices[edge.endIndex];

        const length = v1.distanceTo(v2);
        const newGeo = new PlaneGeometry(length, 0.05);

        room.edgeHandles[index].rotation.z = degToRad(edge.angleInDeg);
        room.edgeHandles[index].position.set((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 0.001);
        room.edgeHandles[index].geometry.dispose();

        room.edgeHandles[index].geometry = newGeo;
    });

    floor.geometry = newFloorGeometry;


    if(vertexToMove || vertexToMove === 0){
        room.verticesHandles[vertexToMove].position.x = room.vertices[vertexToMove].x;
        room.verticesHandles[vertexToMove].position.y = room.vertices[vertexToMove].y;
    }
}