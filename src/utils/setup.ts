import { degToRad } from "three/src/math/MathUtils.js";
import { room, three } from "../store/globalState";
import * as THREE from "three";
import { basicHandleMaterial } from "../store/meterials";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



/**
 * Setup Three.js scene. 
 * Camera, Lights, Resizing, OrbitControls, Renderer.
 */
export function setupScene(){

    /**
     * Camera
     */
    three.camera.position.set(0, 0, 5);
    three.scene.add(three.camera);

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
    three.scene.add(ambientLight);

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    /**
     * Resizing
     */
    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        three.camera!.aspect = sizes.width / sizes.height
        three.camera!.updateProjectionMatrix()

        // Update renderer
        three.renderer!.setSize(sizes.width, sizes.height)
        three.renderer!.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    
    /**
     * Controls
     */
    three.controls = new OrbitControls(three.camera, three.canvas)
    three.controls.enableDamping = true;
    three.controls.enableRotate = false;
    three.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN
    }

    /**
     * Renderer
     */
    three.renderer = new THREE.WebGLRenderer({
        canvas: three.canvas
    })
    three.renderer.shadowMap.enabled = true
    three.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    three.renderer.setSize(sizes.width, sizes.height)
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



/**
 * Create edges for the floor. 
 * Having room.vertices as an array of Vec2 points, save: 
 * - the index that references the start and end vertices inside the rooms.vertices array;
 * - the angle the edge creates with the X axis
 * - the X or Y axes along which the edge is allowed to move (45 deg is allowed on the Y)
 */
export function createEdges(){
    room.edges = [];
    for (let i = 0; i < room.vertices.length; i++) {
        const startIndex = i;
        const endIndex = i != room.vertices.length - 1 ? i + 1 : 0;
    
        const v1 = room.vertices[startIndex];
        const v2 = room.vertices[endIndex];
    
        const angleInRad = Math.atan2(v2.y - v1.y, v2.x - v1.x);
        const angleInDeg = angleInRad * 180.0 / Math.PI;

        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
    
        const direction = Math.abs(dx) < Math.abs(dy) ? 'x' : 'y';
    
        room.edges.push({
            id: i,
            startIndex,
            endIndex,
            angleInDeg,
            direction
        });
    }
}




/**
 * Create handles for each edge
 * 
 * - The handle's length is the same as the edge's one (calculate distance between the start and the end vertices
 * stored in the edge data >> v1 and v2).
 * - Inside the edgeHandle Mesh store the reference edge's index as an ID, and the type 'edge' (used during
 * interactivity to understand if the user is clicking on a EdgeHandle or on a VertexHandle)
 * - Rotate and position the handle, and store it in the edge data
 */
export function createEdgeHandles(){

    room.edges.forEach((edge, index) => {

        const v1 = room.vertices[edge.startIndex];
        const v2 = room.vertices[edge.endIndex];
    
        const length = v1.distanceTo(v2);
        const handleGeometry = new THREE.PlaneGeometry(length, 0.05);
        const edgeHandle = new THREE.Mesh( handleGeometry, basicHandleMaterial);
    
        edgeHandle.userData = {
            id : index,
            type: 'edge'
        }
    
        edgeHandle.rotateZ(degToRad(edge.angleInDeg));
        edgeHandle.position.set((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 0.001);
        
        edge.handle = index;
        room.edgeHandles.push(edgeHandle);
    
        three.scene.add(edgeHandle);
    });
}



/**
 * Create handles for each vertex
 */
export function createVerticesHandles(){
    for (let i = 0; i < room.vertices.length; i++) {
        const vertex = room.vertices[i];
        const sphere = new THREE.Mesh(
            new THREE.CircleGeometry(.03),
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );
        
        sphere.position.set(vertex.x, vertex.y, 0.0011);

        sphere.userData = {
            id: i,
            type: 'vertex'
        }
        
        room.verticesHandles.push(sphere);
        three.scene.add(sphere);
    }
}