import * as THREE from 'three'
import { room, three, state } from './store/globalState';
import { createEdgeHandles, createEdges, createVerticesHandles, setupScene, udpateMode, updateVisibleFaces } from './utils/setup';
import { floorMaterial } from './store/materials';
import { mouseDown, mouseMove2d, mouseUp } from './utils/2d-floor-planner/mouse-function';
import { clickProp, mouseMove3d, mouseUp3d } from './utils/3d-room-editing/move';
import { splitWall } from './utils/2d-floor-planner/floor-editing';
import { startClickTimer } from './utils/helpers';


setupScene();
createEdges();
createEdgeHandles();
createVerticesHandles();


// Add floor mesh to the scene
const shape = new THREE.Shape(room.vertices);
const floorGeometry = new THREE.ShapeGeometry(shape);
room.floor = new THREE.Mesh(floorGeometry, floorMaterial);

room.floor.receiveShadow = true;
room.floor.userData = {
    id: 0
}
three.camera.lookAt(room.floor.position);
three.scene.add(room.floor);

udpateMode('3D');


/**
 * Interactivity
 */
document.addEventListener('mousedown', (event) =>{
    startClickTimer();

    if(state.mode === '2D') mouseDown(event)
        
    if(state.mode === '3D') clickProp(event)
});

document.addEventListener('mousemove', (event) =>{
    
    if(state.mode === '2D') mouseMove2d(event);

    if(state.mode === '3D') mouseMove3d(event);

});

document.addEventListener('mouseup', (event) =>{
    if(state.mode === '2D') mouseUp();

    if(state.mode === '3D') mouseUp3d(event);
});


// Split wall in 2D floor editing
const splitWallButton = document.querySelector('#split-wall') as HTMLElement;
splitWallButton.onclick = () => splitWall();

// Update mode
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
    three.composer!.render();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick();