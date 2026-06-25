import * as THREE from 'three';
import { basicHandleMaterial, errorMaterial } from '../../store/meterials';
import { room, sizes, state, three } from '../../store/globalState';
import { propsState, s } from '../../store/propsState';
import { v7 } from "uuid";
import type { CollisionBox } from '../../types/types';


const lastActivePropPosition = new THREE.Vector3();

const intersection = new THREE.Vector3();

let surfacesToDrag : THREE.Mesh[] = [];
let grabOffset : THREE.Vector3 = new THREE.Vector3();

let collisionBoxes : CollisionBox[] = [];

let propsOnSurface : THREE.Mesh[] = [];
let collisionCheckProps : THREE.Mesh[] = [];
let isMovingSurface : boolean = false;

let isSurface: boolean = false;

export function populatePropItems(){
    propsState.panelItems = Array.from(document.querySelectorAll('.panel-item')) as HTMLElement[];    
    propsState.panelItems.forEach(panelItem => {
        panelItem.addEventListener('mousedown', () => initializeNewProp(panelItem));
    });
}



function initializeNewProp(panelItem : HTMLElement){
    state.isAddingNewProp = true;
    isMovingSurface = false;

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
        isMovingSurface = true;
    }


    surfacesToDrag = isMovingSurface ? [room.floor!] : [room.floor!, ...room.surfaces];

    s.propToMove.userData.isSurface = isSurface;

    s.propToMoveBBox.setFromObject(s.propToMove).getSize(s.propToMoveSize);

    room.buildBBox.setFromObject(room.build);

    updateCollisionProps();

    three.controls.enabled = false;
}



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
}



const getMeshByUserDataValue = (name : string, value : any) => {
    let mesh : THREE.Mesh | null = null;

    three.scene.traverse((node) => {
        if (node.userData[name] === value) {
            mesh = node as THREE.Mesh;
        }
    });

    return mesh;
};



export function clickProp(event: MouseEvent){
    s.hit = false;
    propsOnSurface = [];

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const target = three.raycaster.intersectObjects([...room.props, ...room.surfaces]);
    
    if(target.length > 0){

        s.propToMove = target[0].object as THREE.Mesh;
        three.controls.enabled = false;

        if(room.surfaces.includes(s.propToMove) || state.isAddingNewProp){
            
            surfacesToDrag = [room.floor!];
            isMovingSurface = true;
        }else{
            surfacesToDrag = [room.floor!, ...room.surfaces];
            isMovingSurface = false;
        }

        room.buildBBox.setFromObject(room.build);

        s.propToMoveBBox.setFromObject(s.propToMove).getSize(s.propToMoveSize);

        // Save the starting position of the cube, where the prop will be placed
        // if the drop position is invalid
        lastActivePropPosition.copy(s.propToMove.position);

        (s.propToMove.material as THREE.MeshBasicMaterial).opacity  = 0.5;

        document.body.style.cursor = 'grab';

        const surfacesIntersection = three.raycaster.intersectObjects(surfacesToDrag);

        if (surfacesIntersection.length > 0) {
            s.activeSurface = surfacesIntersection[0].object as THREE.Mesh;

            s.activeSurfaceBBox.setFromObject(s.activeSurface).getSize(s.activeSurfaceSize);

            s.dragPlane.constant = - s.activeSurfaceBBox.max.y - s.propToMoveSize.y / 2;
        }

        updateCollisionProps();

        three.raycaster.ray.intersectPlane( s.dragPlane, intersection);

        grabOffset.copy(intersection).sub(s.propToMove.position);

        three.controls.enabled = false;
    }
}



function updateCollisionProps(){
    collisionBoxes = [];
    propsOnSurface = [];

    // Moving/adding a prop >> collisions for all the items except the prop itself and the surface is being dragged on
    if(isMovingSurface === false){
        collisionCheckProps = [...room.props, ...room.surfaces].filter(item => 
            item.userData.id !== s.propToMove?.userData.id &&
            item.userData.id !== s.activeSurface?.userData.id
        );
    }
    // Moving a surface >> collision for all the items except for the prop itself
    else if(isMovingSurface && !state.isAddingNewProp){
        collisionCheckProps = [...room.surfaces, ...room.props].filter(
            item => item.userData.id !== s.propToMove?.userData.id
        )
    }
    // Adding a surface >> collisions for all the items
    else if(isMovingSurface && state.isAddingNewProp){
        collisionCheckProps = [...room.surfaces, ...room.props];
    }

    collisionCheckProps.forEach(object => {
        const objectBBox = new THREE.Box3().setFromObject(object);

        collisionBoxes.push({
            bbox: objectBBox,
            propId: object.userData.id
        })
    });

    if(isMovingSurface && !s.isNewPropAdded){
        const remainingBoxes : CollisionBox[] = [];
        
        collisionBoxes.forEach(collisionBox => {
        const isOnTop = s.propToMoveBBox.max.x > collisionBox.bbox.max.x &&
            s.propToMoveBBox.min.x < collisionBox.bbox.min.x &&
            s.propToMoveBBox.max.z > collisionBox.bbox.max.z &&
            s.propToMoveBBox.min.z < collisionBox.bbox.min.z

            if (s.propToMoveBBox.intersectsBox(collisionBox.bbox) && isOnTop) {
                const item = getMeshByUserDataValue('id', collisionBox.propId);
                if (item && (item as THREE.Mesh).userData.isSurface === false) {
                    propsOnSurface.push(item);
                }
            } else {
                remainingBoxes.push(collisionBox);
            }
        });

        collisionBoxes = remainingBoxes;
    }
}



export function moveProp(event: MouseEvent){

    if(!s.propToMove || event.target != three.renderer.domElement) return;

    s.hit = false;

    const previousPosition : THREE.Vector3 = s.propToMove.position.clone();
    let oldSurface : THREE.Mesh | null = s.activeSurface;

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    /**
     * Check surface on which the prop is being dragged
     */
    const surfacesIntersection = three.raycaster.intersectObjects(surfacesToDrag);
    
    if(!s.isNewPropAdded && surfacesIntersection.length === 0) return;
    
    if(surfacesIntersection.length > 0){
        if(!state.isAddingNewProp || !isMovingSurface){
            s.activeSurface = surfacesIntersection[0].object as THREE.Mesh;
        }else{
            s.activeSurface = room.floor as THREE.Mesh;
        }

        if(oldSurface && oldSurface?.userData.id !== surfacesIntersection[0].object.userData.id){
            updateCollisionProps();
        }
    
        s.activeSurfaceBBox.setFromObject(s.activeSurface).getSize(s.activeSurfaceSize);
    
        if(s.dragPlane.constant !== - s.activeSurfaceSize.y - (s.propToMoveSize.y / 2)){
            s.dragPlane.constant = - s.activeSurfaceSize.y - (s.propToMoveSize.y / 2);
            updateCollisionProps();
        }
    }

    /**
     * Update prop positon
     */
    three.raycaster.ray.intersectPlane(s.dragPlane, intersection);

    // Clamp the X and Z position to not overflow the surface they are being dragged on
    const pX = intersection.x - grabOffset.x;
    const pZ = intersection.z - grabOffset.z;

    const minX = s.activeSurfaceBBox.min.x + (s.propToMoveSize.x / 2) + 0.001;
    const maxX = s.activeSurfaceBBox.max.x - (s.propToMoveSize.x / 2) - 0.001;
    const minZ = s.activeSurfaceBBox.min.z + (s.propToMoveSize.z / 2) + 0.001;
    const maxZ = s.activeSurfaceBBox.max.z - (s.propToMoveSize.z / 2) - 0.001;

    s.propToMove.position.x = THREE.MathUtils.clamp(pX, minX, maxX);
    s.propToMove.position.z = THREE.MathUtils.clamp(pZ, minZ, maxZ);

    // Prop's Y position depends on the height of the surface it's being dragged on
    s.propToMove.position.y = s.activeSurfaceSize.y + (s.propToMoveSize.y / 2);

    const delta = new THREE.Vector3().subVectors(s.propToMove.position, previousPosition);

    if(isMovingSurface){
        propsOnSurface.forEach(prop => {
            prop.position.add(delta);
        });
    }

    s.propToMoveBBox.translate(delta);

    previousPosition.copy(s.propToMove.position);


    /**
     * Check for collisions
     */
    collisionBoxes.forEach(collisionBox => {
        if(s.propToMoveBBox.intersectsBox(collisionBox.bbox)){
            s.hit = true;
        }
    });

    if(!s.isNewPropAdded){
        updateCollisionProps();
        three.scene.add(s.propToMove);
        s.isNewPropAdded = true;
    }

    if(s.hit){
        s.propToMove.material = errorMaterial;
    }else{
        s.propToMove.material = basicHandleMaterial;
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
}