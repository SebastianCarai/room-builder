import { v7 } from "uuid";
import { room, state, three } from "../../store/globalState";
import { basicHandleMaterial } from "../../store/meterials";
import { propsState, s } from "../../store/propsState";
import * as THREE from 'three';

let isSurface: boolean = false;

export function populatePropItems(){
    propsState.panelItems = Array.from(document.querySelectorAll('.panel-item')) as HTMLElement[];    
    propsState.panelItems.forEach(panelItem => {
        panelItem.addEventListener('mousedown', () => initializeNewProp(panelItem));
    });
}

function initializeNewProp(panelItem : HTMLElement){
    state.isAddingNewProp = true;

    let newGeo : THREE.SphereGeometry | THREE.BoxGeometry;

    if(panelItem.dataset.model?.includes('_cube')){
        newGeo = new THREE.BoxGeometry(.25, .25, .25);
    }else if(panelItem.dataset.model?.includes('_table')){
        newGeo = new THREE.BoxGeometry(.8, .3, .5);
    }else if(panelItem.dataset.model?.includes('_sphere')){
        newGeo = new THREE.SphereGeometry(.15);
    }

    const newProp = new THREE.Mesh(newGeo!, basicHandleMaterial);
    s.propToMove = newProp;


    if(panelItem.dataset.model?.includes('_s_')){
        isSurface = true;
    }
    
    s.propToMove.userData.isSurface = isSurface;

    s.propToMove.geometry.computeBoundsTree();

    // Set the dragPlane Y position to match /2 the size of the prop
    s.propToMoveBBox.setFromObject(s.propToMove);
    s.propToMoveBBox.getSize(s.propToMoveSize);
    s.dragPlane.constant = - s.propToMoveSize.y / 2;

    room.buildBBox.setFromObject(room.build);

    three.controls.enabled = false;
}

const direction = new THREE.Vector3(0, -1, 0)
direction.normalize();


export function releaseNewProp(){
    if(!s.propToMove) return

    
    if(s.hit){
        three.scene.remove(s.propToMove!);
        // Dispose Geometry
    }else{
        s.propToMove.userData.id = v7();
        (s.propToMove.material as THREE.MeshBasicMaterial).opacity = 1;

        if(isSurface){
            room.surfaces.push(s.propToMove);
        }else{
            room.props.push(s.propToMove!);
        }

    }
    
    
    document.body.style.cursor = 'default';
    three.controls.enabled = true;
    s.propToMove = null;
    s.propToMoveBBox.makeEmpty();
    state.isAddingNewProp = false;
    s.isNewPropAdded = false;
    isSurface = false;
    s.dragPlane.constant = 0;
}





