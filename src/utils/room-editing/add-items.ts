import { v7 } from "uuid";
import { room, sizes, state, three } from "../../store/globalState";
import { basicHandleMaterial, errorMaterial } from "../../store/meterials";
import { propsState } from "../../store/propsState";
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import type { MeshBVH } from 'three-mesh-bvh';

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

three.raycaster.firstHitOnly = true;

let hit = false;
const dragPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0), // horizontal plane
    0.125 // y = 0
);
const meshSize = new THREE.Vector3();
const intersection = new THREE.Vector3();
const shift = new THREE.Vector3();


export function populatePropItems(){
    propsState.panelItems = Array.from(document.querySelectorAll('.panel-item')) as HTMLElement[];
    let newGeo : THREE.SphereGeometry | THREE.BoxGeometry;
    
    propsState.panelItems.forEach(panelItem => {
        panelItem.addEventListener('mousedown', () => {
            if(panelItem.dataset.model === 'cube'){
                newGeo = new THREE.BoxGeometry(.25, .25, .25);
            }else if(panelItem.dataset.model === 'table'){
                newGeo = new THREE.BoxGeometry(.8, .3, .5);
            }else if(panelItem.dataset.model === 'sphere'){
                newGeo = new THREE.SphereGeometry(.15);
            }
            const newProp = new THREE.Mesh(newGeo, basicHandleMaterial);
            propsState.propToAdd = newProp;
            propsState.propToAdd.geometry.computeBoundsTree();
            state.isAddingNewProp = true;
            propsState.propToAddBBox.setFromObject(propsState.propToAdd);
            propsState.propToAddBBox.getSize(meshSize);
            dragPlane.constant = - meshSize.y / 2;
            room.buildBBox.setFromObject(room.build);
        })
    });
}

export function dragNewProp(event : MouseEvent){
    if(!propsState.propToAdd || event.target !== three.renderer.domElement) return;

    three.controls.enabled = false;
    hit = false;
    
    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);
    
    const previousPosition = propsState.propToAdd.position.clone();
    if(!propsState.isNewPropAdded){

        const target = three.raycaster.intersectObject(room.floor!)
        
        if(target.length > 0){
            
            propsState.propToAdd.position.copy(new THREE.Vector3(
                target[0].point.x,
                meshSize.y / 2,
                target[0].point.z)
            );
            three.scene.add(propsState.propToAdd);

            propsState.isNewPropAdded = true;
            const delta = new THREE.Vector3().subVectors(propsState.propToAdd.position, previousPosition);
            propsState.propToAddBBox.translate(delta);
            return
        }

    }


    // Update prop position
    if(three.raycaster.ray.intersectPlane(dragPlane, intersection)){
        propsState.propToAdd.position.copy(intersection).add(shift);

        const delta = new THREE.Vector3().subVectors(propsState.propToAdd.position, previousPosition);

        propsState.propToAddBBox.translate(delta);

        previousPosition.copy(propsState.propToAdd.position);

    }
    

    [...room.walls, ...room.props].forEach(prop => {
        const bvh = prop.geometry.boundsTree as MeshBVH;
        
        // Check if prop is outside of the walls or is colliding with one of them
        if(
            !room.buildBBox.containsBox(propsState.propToAddBBox) || 
            bvh.intersectsGeometry( 
                propsState.propToAdd!.geometry, 
                new THREE.Matrix4().copy( prop.matrixWorld ).invert().multiply( propsState.propToAdd!.matrixWorld ) )
        ){
            hit = true
        }
    });

    if(hit){
        propsState.propToAdd.material = errorMaterial;
    }else{
        propsState.propToAdd.material = basicHandleMaterial;
    }
}


export function releaseNewProp(){
    if(!propsState.propToAdd) return

    if(hit){
        three.scene.remove(propsState.propToAdd!);

        // Dispose Geometry
    }else{
        propsState.propToAdd.userData.id = v7();
        room.props.push(propsState.propToAdd!);
        three.controls.enabled = true;
        propsState.propToAdd = null;
    }

    propsState.propToAddBBox.makeEmpty();
    propsState.isNewPropAdded = false;
    state.isAddingNewProp = false;
    dragPlane.constant = 0;
}


