import * as THREE from 'three'
// import GUI from 'lil-gui';
import { room, three } from './store/globalState';
import { createEdgeHandles, createEdges, createVerticesHandles, setupScene } from './utils/setup';
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
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
three.camera.lookAt(floor.position);
three.scene.add(floor);


/**
 * Interactivity
 */
document.addEventListener('mousedown', (event) => mouseDown(event) );
document.addEventListener('mousemove', (event) => mouseMove(event, floor) );
document.addEventListener('mouseup', () => mouseUp() );


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



// const wallsGeometry = new THREE.ExtrudeGeometry(shape, {
//   depth: 1,
//   bevelEnabled: false
// });
// const walls = new THREE.Mesh(wallsGeometry, defaultMaterial);