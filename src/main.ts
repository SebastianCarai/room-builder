import * as THREE from 'three'
// import GUI from 'lil-gui';
import { room, three, splitWallButton, state } from './store/globalState';
import { createEdgeHandles, createEdges, createVerticesHandles, setupScene, udpateMode, updateVisibleFaces } from './utils/setup';
import { floorMaterial } from './store/meterials';
import { mouseDown, mouseMove, mouseUp } from './utils/floor-planner/interactivity';


// const gui = new GUI();

setupScene();
createEdges();
createEdgeHandles();
createVerticesHandles();


// Add floor mesh to the scene
const shape = new THREE.Shape(room.vertices);
const floorGeometry = new THREE.ShapeGeometry(shape);
room.floor = new THREE.Mesh(floorGeometry, floorMaterial);
three.camera.lookAt(room.floor.position);
three.scene.add(room.floor);


/**
 * Interactivity
 */
document.addEventListener('mousedown', (event) => mouseDown(event) );
document.addEventListener('mousemove', (event) => mouseMove(event) );
document.addEventListener('mouseup', () => mouseUp() );


splitWallButton.onclick = () => {
    const edgeToSplit = room.edgeToMove;
    const v1 = room.vertices[edgeToSplit?.startIndex!];
    const v2 = room.vertices[edgeToSplit?.endIndex!];

    const midPoint = new THREE.Vector2((v1!.x + v2!.x)/2, (v1.y + v2.y)/2);

    room.vertices.splice(edgeToSplit?.endIndex!, 0, midPoint);

    console.log('after: ', room);

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

const button2d = document.querySelector('#button-2d') as HTMLElement;
const button3d = document.querySelector('#button-3d') as HTMLElement;

button2d.onclick = () => udpateMode('2D');
button3d.onclick = () => udpateMode('3D');

three.controls.addEventListener('change', () => {
    if(state.mode === '2D') return;

    updateVisibleFaces()
})


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