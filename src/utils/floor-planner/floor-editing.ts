import { Vector2, Shape, ShapeGeometry, PlaneGeometry } from "three";
import { room, three } from "../../store/globalState";
import { createEdges, createEdgeHandles, createVerticesHandles } from "../setup";
import { degToRad } from "three/src/math/MathUtils.js";


/**
 * 
 * @param floor 
 * @param vertexToMove 
 */
export function rebuildRoomFloor(vertexToMove: number | null){

    // Floor Geometry
    const newShape = new Shape(room.vertices);
    const newFloorGeometry = new ShapeGeometry(newShape);
    room.floor!.geometry.dispose();


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

    room.floor!.geometry = newFloorGeometry;


    if(vertexToMove || vertexToMove === 0){
        room.verticesHandles[vertexToMove].position.x = room.vertices[vertexToMove].x;
        room.verticesHandles[vertexToMove].position.y = room.vertices[vertexToMove].y;
    }
}


export function splitWall(){
    const edgeToSplit = room.edgeToMove;
    const v1 = room.vertices[edgeToSplit?.startIndex!];
    const v2 = room.vertices[edgeToSplit?.endIndex!];

    const midPoint = new Vector2((v1!.x + v2!.x)/2, (v1.y + v2.y)/2);

    room.vertices.splice(edgeToSplit?.endIndex!, 0, midPoint);

    // Update vertices Handles
    room.verticesHandles.forEach(vertexHandle => {
        vertexHandle.geometry.dispose();
        vertexHandle.clear();
        three.scene.remove(vertexHandle);
    });
    room.verticesHandles = [];
    createVerticesHandles();

    // Update Edge data
    room.edges = [];
    createEdges();

    // Update Edge Handles
    room.edgeHandles.forEach(edgeHandle => {
        edgeHandle.geometry.dispose();
        edgeHandle.clear();
        three.scene.remove(edgeHandle);
    });
    room.edgeHandles = [];
    createEdgeHandles();
}