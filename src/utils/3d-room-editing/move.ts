import * as THREE from 'three';
import { panels, room, sizes, state, three } from '../../store/globalState';
import { r, s } from '../../store/roomState';
import { v7 } from "uuid";
import type { CollisionBox } from '../../types/types';
import { gltfLoader } from '../../store/loaders';
import { addHoverGlow } from './outline';
import { removeGroupFromScene } from './threeHelpers';
import { checkClick } from '../helpers';
import { handleClick } from './click-editing';
import { checkRotation, rotateProp } from './rotation';


const lastActivePropPosition = new THREE.Vector3();

const intersection = new THREE.Vector3();

let surfacesToDrag : (THREE.Mesh | THREE.Group)[] = [];
let grabOffset : THREE.Vector3 = new THREE.Vector3();

let collisionBoxes : CollisionBox[] = [];

let propsOnSurface : THREE.Group[] = [];
let collisionCheckProps : (THREE.Mesh | THREE.Group)[] = [];
let isMovingSurface : boolean = false;

let isSurface: boolean = false;



/**
 * Populate prop items on the Props Panel
 */
export function populatePropItems(){
    room.panelItems = Array.from(panels.propsPanel.querySelectorAll('.panel-item')) as HTMLElement[];    
    room.panelItems.forEach(panelItem => {
        panelItem.addEventListener('mousedown', async () => await initializeNewProp(panelItem));
    });
}



/**
 * Update collision data
 */
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
                s.propToMoveBBox.min.z < collisionBox.bbox.min.z;
            
            if (isOnTop) {
                const item = getModelByUserDataValue('id', collisionBox.propId);
                
                if (item && item.userData.isSurface === false) {
                    propsOnSurface.push(item);
                }
            } else {
                remainingBoxes.push(collisionBox);
            }
        });

        collisionBoxes = remainingBoxes;
    }
}



/**
 * 
 * @param panelItem : HTMLElement  > Item to add to the scene
 * 
 * Function called when user clicks on a panel item.
 * Import GLTF model
 */
async function initializeNewProp(panelItem : HTMLElement){
    state.isAddingNewProp = true;

    const modelPath = `/models/${panelItem.dataset.model}.glb`;
    const model = await gltfLoader.loadAsync(modelPath);
    const newProp = model.scene;

    newProp.traverse((child) => {
        child.castShadow = true;
    });
    // newProp.castShadow = true;
    s.propToMove = newProp;

    // Check if the new prop is a surface (table, shelf, etc...)
    if(panelItem.dataset.model?.includes('_s_')){
        isSurface = true;
        isMovingSurface = true;
    }else{
        isSurface = false;
        isMovingSurface = false;
    }

    // Surfaces props can only be dragged on the floor, and not on other surfaces
    surfacesToDrag = isMovingSurface ? [room.floor!] : [room.floor!, ...room.surfaces];

    s.propToMove.userData.isSurface = isSurface;

    // Update prop's and room's bounding boxes
    s.propToMoveBBox.setFromObject(s.propToMove).getSize(s.propToMoveSize);
    room.buildBBox.setFromObject(room.build);

    updateCollisionProps();

    three.controls.enabled = false;
}



/**
 * 
 * @param name : string > key of the userData to check
 * @param value : any > value of the key to check
 * @returns model : THREE.Group > return match if found, or null if not
 */
const getModelByUserDataValue = (name : string, value : any) : THREE.Group | null => {
    let model : THREE.Group | null = null;

    room.props.forEach(prop => {
        if(prop.userData[name] === value) model = prop;
    });

    return model;
};



/**
 * 
 * @param event : MouseEvent
 * 
 * Function called when a user clicks on the canvas
 */
export function clickProp(event: MouseEvent){
    s.hit = false;
    propsOnSurface = [];

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / sizes.height) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const target = three.raycaster.intersectObjects([...room.props, ...room.surfaces]);

    if(target.length > 0){
        s.propToMove = target[0].object.parent as THREE.Group;
        while(s.propToMove.parent instanceof THREE.Group){
            s.propToMove = s.propToMove?.parent;
        }

        if(!s.propToMove) return;

        three.controls.enabled = false;

        if(room.surfaces.includes(s.propToMove) || state.isAddingNewProp){
            surfacesToDrag = [room.floor!];
            isMovingSurface = true;
        }else{
            surfacesToDrag = [room.floor!, ...room.surfaces];
            isMovingSurface = false;
        }

        room.buildBBox.setFromObject(room.build);

        s.propToMoveBBox.setFromObject(s.propToMove!).getSize(s.propToMoveSize);

        // Save the starting position of the cube, where the prop will be placed
        // if the drop position is invalid
        lastActivePropPosition.copy(s.propToMove.position);

        if(state.canRotate){
            r.startRotation = s.propToMove.rotation.y;
            r.startX = event.clientX;
            state.isRotating = true;
        } 

        if(state.isRotating) return;

        document.body.style.cursor = 'grab';

        const surfacesIntersection = three.raycaster.intersectObjects(surfacesToDrag);

        if (surfacesIntersection.length > 0) {
            s.activeSurface = surfacesIntersection[0].object as THREE.Mesh;

            s.activeSurfaceBBox.setFromObject(s.activeSurface).getSize(s.activeSurfaceSize);

            s.dragPlane.constant = s.activeSurfaceBBox.max.y;
        }

        updateCollisionProps();

        three.raycaster.ray.intersectPlane( s.dragPlane, intersection);

        grabOffset.copy(intersection).sub(s.propToMove.position);

        three.controls.enabled = false;
    }
}



/**
 * 
 * @param event : MouseEvent
 * 
 * Function called when mouse is moving
 * - Check hover for outline
 * - Move mouse if there is propToMove is populated
 */
export function mouseMove3d(event: MouseEvent){

    if(event.target !== three.renderer.domElement) return;

    if(!state.isRotating) checkRotation(event);

    addHoverGlow(event);

    if(!s.propToMove) return;

    if(state.canRotate){
        rotateProp(event); 
        return
    } 

    s.hit = false;
    state.isDragging = true;

    const previousPosition : THREE.Vector3 = s.propToMove.position.clone();

    let oldSurface : THREE.Mesh | THREE.Group | null = s.activeSurface;

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    /**
     * Check surface on which the prop is being dragged
     */
    const surfacesIntersection = three.raycaster.intersectObjects(surfacesToDrag);
    
    // Return when adding a new prop and the mouse is not intersecting any surface
    if(state.isAddingNewProp && !s.isNewPropAdded && surfacesIntersection.length === 0) return;
    

    if(surfacesIntersection.length > 0){

        // If it's moving a prop >> activeSurface can be either the floor or any valid surface
        if(!state.isAddingNewProp || !isMovingSurface){

            if(surfacesIntersection[0].object.parent instanceof THREE.Scene){
                s.activeSurface = surfacesIntersection[0].object as THREE.Mesh;
            }else if(surfacesIntersection[0].object.parent instanceof THREE.Group){
                s.activeSurface = surfacesIntersection[0].object.parent;
            }
        }
        // If it's moving a surface >> activeSurface can only be the floor
        else{
            s.activeSurface = room.floor as THREE.Mesh;
        }

        // If it's dragging on a new surface
        if(oldSurface && oldSurface?.userData.id !== surfacesIntersection[0].object.userData.id){
            updateCollisionProps();
        }
    
        s.activeSurfaceBBox.setFromObject(s.activeSurface as THREE.Object3D).getSize(s.activeSurfaceSize);
    
        if(s.dragPlane.constant !== s.activeSurfaceSize.y){
            s.dragPlane.constant = s.activeSurfaceSize.y;
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
    s.propToMove.position.y = s.activeSurfaceSize.y;

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

    if(!s.isNewPropAdded && state.isAddingNewProp){
        updateCollisionProps();
        three.scene.add(s.propToMove, new THREE.Box3Helper(s.propToMoveBBox));
        s.isNewPropAdded = true;
    }

    if(s.hit){
        // s.propToMove.material = errorMaterial;
    }else{
        // s.propToMove.material = basicHandleMaterial;
    }
}



export function mouseUp3d(event : MouseEvent){
    const isClick = checkClick();

    if(isClick) handleClick(event);

    releaseProp();
}



/**
 * 
 * Release prop at the new position if it's valid
 * Snap prop at the old position if the new one is not valid
 * When adding a new prop, if the release position is valid, add it to the scene.
 * Otherwise remove it and dispose the geometries and materials
 */
export function releaseProp(){
    if(!s.propToMove || !state.isDragging) return;

    if(s.hit){
        if(state.isAddingNewProp) removeGroupFromScene(s.propToMove as THREE.Group);

        (s.propToMove as THREE.Group).position.copy(lastActivePropPosition);
    }else{
        if(state.isAddingNewProp){
            s.propToMove.userData.id = v7();

            if(isSurface){
                room.surfaces.push(s.propToMove);
            }else{
                room.props.push(s.propToMove!);
            }
        }
    }
    
    s.propToMove = null;
    document.body.style.cursor = 'default';
    state.isAddingNewProp = false;
    isSurface = false;
    three.controls.enabled = true;
    s.isNewPropAdded = false;
    state.canRotate = false;
    state.isRotating = false;
}