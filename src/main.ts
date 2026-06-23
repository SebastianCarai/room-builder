import * as THREE from 'three'
// import GUI from 'lil-gui';
import { room, three, splitWallButton, state } from './store/globalState';
import { createEdgeHandles, createEdges, createVerticesHandles, setupScene, udpateMode, updateVisibleFaces } from './utils/setup';
import { basicHandleMaterial, floorMaterial } from './store/meterials';
import { mouseDown, mouseMove, mouseUp } from './utils/floor-planner/mouse-function';
import { clickProp, moveProp, releaseProp } from './utils/room-editing/move';
import { splitWall } from './utils/floor-planner/floor-editing';
import { releaseNewProp } from './utils/room-editing/add-items';


// const gui = new GUI();

setupScene();
createEdges();
createEdgeHandles();
createVerticesHandles();


// Add floor mesh to the scene
const shape = new THREE.Shape(room.vertices);
const floorGeometry = new THREE.ShapeGeometry(shape);
room.floor = new THREE.Mesh(floorGeometry, floorMaterial);
room.floor.userData = {
    surfaceY : 0
}
three.camera.lookAt(room.floor.position);
three.scene.add(room.floor);

udpateMode('3D');


const testBox = new THREE.Mesh(
    new THREE.BoxGeometry(.25, .25, .25),
    basicHandleMaterial
);
const testTable = new THREE.Mesh(
    new THREE.BoxGeometry(1, .5, .75),
    basicHandleMaterial
);
testBox.position.y = .125;
testBox.position.z = .8;
testTable.position.y = .25;
testTable.position.z = -.5;
testTable.userData.isSurface = true;
testBox.geometry.computeBoundsTree();
testTable.geometry.computeBoundsTree();

room.props.push(testBox);
room.surfaces.push(testTable);

three.scene.add(testBox, testTable)


/**
 * Interactivity
 */
document.addEventListener('mousedown', (event) =>{
    if(state.mode === '2D') mouseDown(event)
        
    if(state.mode === '3D') clickProp(event)
});

document.addEventListener('mousemove', (event) =>{
    
    if(state.mode === '2D') mouseMove(event);
        
    if(state.mode === '3D') moveProp(event);

});

document.addEventListener('mouseup', () =>{
    if(state.mode === '2D') mouseUp();

    if(state.mode === '3D'){
        if(state.isAddingNewProp){
            releaseNewProp();
            return
        } 

        if(state.mode === '3D') releaseProp()
    } 
});


splitWallButton.onclick = () => splitWall();

const button2d = document.querySelector('#button-2d') as HTMLElement;
const button3d = document.querySelector('#button-3d') as HTMLElement;

button2d.onclick = () => udpateMode('2D');
button3d.onclick = () => udpateMode('3D');


three.controls.addEventListener('change', () => {
    if(state.mode === '2D') return;

    updateVisibleFaces();
});



/**
 * Animate
 */
const clock = new THREE.Timer();

const tick = () =>
{
    clock.getDelta();

    // Update controls
    three.controls.update();

    // Render
    three.renderer.render(three.scene, three.camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick();