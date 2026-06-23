import * as THREE from 'three';
import { basicHandleMaterial, errorMaterial } from '../../store/meterials';
import { room, sizes, three } from '../../store/globalState';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import type { MeshBVH } from 'three-mesh-bvh';
import { s } from '../../store/propsState';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

three.raycaster.firstHitOnly = true;

const lastActivePropPosition = new THREE.Vector3();

var planeNormal = new THREE.Vector3(0, 1, 0);
const intersection = new THREE.Vector3();
const shift = new THREE.Vector3();


const dragOffsetXZ = new THREE.Vector3();

export function clickProp(event: MouseEvent){
    s.hit = false;

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const target = three.raycaster.intersectObjects([...room.props, ...room.surfaces]);
    
    if(target.length > 0){

        s.propToMove = target[0].object as THREE.Mesh;
        three.controls.enabled = false;

        room.buildBBox.setFromObject(room.build);

        s.propToMoveBBox.setFromObject(s.propToMove).getSize(s.propToMoveSize);

        // Save the starting position of the cube, where the prop will be placed
        // if the drop position is invalid
        lastActivePropPosition.copy(s.propToMove.position);

        (s.propToMove.material as THREE.MeshBasicMaterial).opacity  = 0.5;

        document.body.style.cursor = 'grab';

        const floorHit = three.raycaster.intersectObjects([...room.surfaces, room.floor!]);

        if (floorHit.length) {
            dragOffsetXZ.set(
                s.propToMove.position.x - floorHit[0].point.x,
                0,
                s.propToMove.position.z - floorHit[0].point.z
            );
        }

        three.controls.enabled = false;
    }
}


const direction = new THREE.Vector3(0, -1, 0)
direction.normalize();

export function moveProp(event: MouseEvent){

    if(!s.propToMove || event.target != three.renderer.domElement) return;

    s.hit = false;

    const previousPosition : THREE.Vector3 = s.propToMove.position.clone();


    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const surfacesIntersection = three.raycaster.intersectObjects([...room.surfaces, room.floor!]);

    if(surfacesIntersection.length > 0){
        s.activeSurface = surfacesIntersection[0].object as THREE.Mesh;
        s.activeSurfaceBBox.setFromObject(s.activeSurface).getSize(s.activeSurfaceSize);

        s.dragPlane.constant = - s.activeSurfaceSize.y - (s.propToMoveSize.y / 2);

        const hitSurface = three.raycaster.intersectObject(s.activeSurface);

        if(hitSurface.length > 0 ){

            s.propToMove.position.set(
                hitSurface[0].point.x + dragOffsetXZ.x,
                -s.dragPlane.constant,
                hitSurface[0].point.z + dragOffsetXZ.z
            );

            const delta = new THREE.Vector3().subVectors(s.propToMove.position, previousPosition);

            s.propToMoveBBox.translate(delta);

            previousPosition.copy(s.propToMove.position);
        }
    }
}


export function releaseProp(){

    if(!s.propToMove) return

    if(s.hit){
        s.propToMove.position.copy(lastActivePropPosition);
        s.propToMove.material = basicHandleMaterial;
    }
    
    (s.propToMove.material as THREE.MeshBasicMaterial).opacity = 1;
    three.controls.enabled = true;
    s.propToMove = null;
    document.body.style.cursor = 'default';
    s.propToMoveBBox.makeEmpty();
    s.isNewPropAdded = false;
    s.dragPlane.constant = 0;
}