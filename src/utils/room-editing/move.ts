import * as THREE from 'three';
import { basicHandleMaterial, errorMaterial } from '../../store/meterials';
import { room, sizes, three } from '../../store/globalState';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import type { MeshBVH } from 'three-mesh-bvh';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

three.raycaster.firstHitOnly = true;

let hit = false;
const lastActivePropPosition = new THREE.Vector3();
const dragPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0), // horizontal plane
    0 // y = 0
);

var planeNormal = new THREE.Vector3(0, 1, 0);
const intersection = new THREE.Vector3();
const shift = new THREE.Vector3();
let propsToInterset : THREE.Mesh[];

export function clickProp(event: MouseEvent){
    hit = false;

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const target = three.raycaster.intersectObjects(room.props);
    
    if(target.length > 0){
        room.propToMove = target[0].object as THREE.Mesh;
        three.controls.enabled = false;

        room.buildBBox.setFromObject(room.build);
        room.propBBox.setFromObject(room.propToMove);

        // Save the starting position of the cube, where the prop will be placed
        // if the drop position is invalid
        lastActivePropPosition.copy(room.propToMove.position);

        (room.propToMove.material as THREE.MeshBasicMaterial).opacity  = 0.5;

        document.body.style.cursor = 'grab';

        // Update the plane on which dragging will occur
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, target[0].point);
        // Save offset between the object's position and the clicked point on the prop,
        // so the object doesn't jump when dragging starts
        shift.subVectors(room.propToMove.position, target[0].point);

        propsToInterset = room.props.filter(prop => prop.userData.id != room.propToMove?.userData.id);
    }
}



export function moveProp(event: MouseEvent){
    if(!room.propToMove) return;

    hit = false;

    const previousPosition = room.propToMove.position.clone();

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    // Update prop position
    if(three.raycaster.ray.intersectPlane(dragPlane, intersection)){
        room.propToMove.position.copy(intersection).add(shift);

        const delta = new THREE.Vector3().subVectors(room.propToMove.position, previousPosition);

        room.propBBox.translate(delta);

        previousPosition.copy(room.propToMove.position);

    }


    [...room.walls, ...propsToInterset].forEach(prop => {
        const bvh = prop.geometry.boundsTree as MeshBVH;
        
        // Check if prop is outside of the walls or is colliding with one of them
        if(
            !room.buildBBox.containsBox(room.propBBox) || 
            bvh.intersectsGeometry( 
                room.propToMove!.geometry, 
                new THREE.Matrix4().copy( prop.matrixWorld ).invert().multiply( room.propToMove!.matrixWorld ) )
        ){
            hit = true
        }
    });

    if(hit){
        room.propToMove.material = errorMaterial;
    }else{
        room.propToMove.material = basicHandleMaterial;
    }
}


export function releaseProp(){

    if(room.propToMove){

        // If hit >> prop is outside of the walls or is colliding with one of them
        // Place the prop to his starting position
        if(hit){
            room.propToMove.position.copy(lastActivePropPosition);
            room.propToMove.material = basicHandleMaterial;
        }
        
        (room.propToMove.material as THREE.MeshBasicMaterial).opacity = 1;
        room.propBBox.setFromObject(room.propToMove);
        three.controls.enabled = true;
        room.propToMove = null;
        document.body.style.cursor = 'default';
    }
}