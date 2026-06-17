import * as THREE from 'three';
import { basicHandleMaterial, errorMaterial } from '../../store/meterials';
import { room, state, three } from '../../store/globalState';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import type { MeshBVH } from 'three-mesh-bvh';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

let mesh : THREE.Mesh;

three.raycaster.firstHitOnly = true;

let hit = false;
const lastActivePropPosition = new THREE.Vector3();

let propBBox = new THREE.Box3();
let buildBBox = new THREE.Box3();

export function addCube(){
    const cubeGeometry = new THREE.BoxGeometry(.25, .25, .25);
    mesh = new THREE.Mesh( cubeGeometry, basicHandleMaterial );

    mesh.geometry.computeBoundsTree();

    mesh.position.y = (mesh.geometry as THREE.BoxGeometry).parameters.height / 2;

    (mesh.material as THREE.MeshBasicMaterial).polygonOffset = true;
    (mesh.material as THREE.MeshBasicMaterial).polygonOffsetFactor = 0.01;
    propBBox.setFromObject(mesh);
    console.log('propBBox: ', propBBox);
    

    three.scene.add(mesh);
}


const dragPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0), // horizontal plane
    0 // y = 0
);
var planeNormal = new THREE.Vector3(0, 1, 0);
const intersection = new THREE.Vector3();
const shift = new THREE.Vector3();


export function clickProp(event: MouseEvent){

    buildBBox.setFromObject(room.build);

    hit = false;
    three.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    three.raycaster.setFromCamera(three.mouse, three.camera);
    
    const found = three.raycaster.intersectObject(mesh);
    
    if(found.length > 0){
        three.controls.enabled = false;
        room.propToMove = mesh;
        lastActivePropPosition.copy(room.propToMove.position)
        state.isDragging = true;
        (room.propToMove.material as THREE.MeshBasicMaterial).opacity  = 0.5;
        document.body.style.cursor = 'grab';
        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, found[0].point);
        shift.subVectors(room.propToMove.position, found[0].point);
    }
}



export function moveProp(event: MouseEvent){

    hit = false;
    if(!room.propToMove) return;

    const previousPosition = room.propToMove.position.clone();

    three.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    if(three.raycaster.ray.intersectPlane(dragPlane, intersection)){
        room.propToMove.position.copy(intersection).add(shift);
        const delta = new THREE.Vector3()
        .subVectors(room.propToMove.position, previousPosition);

        propBBox.translate(delta);

        previousPosition.copy(room.propToMove.position);

    }

    room.walls.forEach(wall => {
        const bvh = wall.geometry.boundsTree as MeshBVH;

        if(
            bvh.intersectsGeometry( 
                mesh.geometry, 
                new THREE.Matrix4().copy( wall.matrixWorld ).invert().multiply( mesh.matrixWorld ) ) 
            || 
            !buildBBox.containsBox(propBBox)
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

        if(hit){
            room.propToMove.position.copy(lastActivePropPosition);
            room.propToMove.material = basicHandleMaterial;
        }
        (room.propToMove.material as THREE.MeshBasicMaterial).opacity = 1;
        propBBox.setFromObject(room.propToMove);
        three.controls.enabled = true;
        state.isDragging = false;
        room.propToMove = null;
        document.body.style.cursor = 'default';

    }
}