import { degToRad } from "three/src/math/MathUtils.js";
import { room, state, three, sizes, panelWidth, setPanelWidthFromMode } from "../store/globalState";
import * as THREE from "three";
import { basicHandleMaterial } from "../store/meterials";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from "gsap";
import { populatePropItems } from "./3d-room-editing/move";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { addHoverGlow, setupOutlinePass} from "./3d-room-editing/outline";


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
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    const spotLight = new THREE.SpotLight(0xffffff, 20, 2, Math.PI / 2, 1, 1)
    spotLight.position.y = 1.5;
    three.scene.add(ambientLight);

    /**
     * Resizing
     */
    window.addEventListener( 'resize', () => resizeCanvas(state.mode) )

    /**
     * Controls
     */
    three.controls = new OrbitControls(three.camera, three.canvas)
    three.controls.enableDamping = true;
    updateOrbitControls('3D');

    /**
     * Renderer
     */
    three.renderer = new THREE.WebGLRenderer({
        canvas: three.canvas
    })
    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    three.renderer.setSize(sizes.width, sizes.height);
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


    /**
     * Composer
     */
    three.composer = new EffectComposer( three.renderer );

	//Setup renderPass and add it to the composer
	const renderPass = new RenderPass( three.scene, three.camera );
	three.composer.addPass( renderPass );

    // Outline pass and hover glow
    setupOutlinePass();
	document.addEventListener('mousemove', addHoverGlow, false);
}





export function resizeCanvas(mode: '2D' | '3D'){
    
    setPanelWidthFromMode(mode);
    

    // Update sizes
    sizes.width = window.innerWidth - panelWidth;
    sizes.height = window.innerHeight

    // Update camera
    three.camera!.aspect = sizes.width / sizes.height
    three.camera!.updateProjectionMatrix()

    // Update renderer
    three.renderer!.setSize(sizes.width, sizes.height)
    three.renderer!.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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



export function udpateMode(mode: '2D' | '3D'){
    state.mode = mode;
    const panel = document.querySelector('.props-panel') as HTMLElement;

    updateOrbitControls(mode);

    
    // Swicth to 3d mode
    if(mode === '3D'){
        setPanelWidthFromMode(mode);
        resizeCanvas(mode);
        panel.style.display = 'flex';
        populatePropItems();
        
        createWalls();
        
        room.edgeHandles.forEach(edgeHandle => {
            three.scene.remove(edgeHandle);
        });
        room.verticesHandles.forEach(vertexHandle => {
            three.scene.remove(vertexHandle);
        });
        
        room.floor!.rotation.x = Math.PI / 2;
        three.camera.position.set(2, 2, 2);
        
        updateVisibleFaces();

    }

    // Switch to 2D mode (floor editing)
    else{
        setPanelWidthFromMode(mode);
        resizeCanvas(mode);
        panel.style.display = 'none';
        

        room.floor!.rotation.x = 0;
        room.build.clear()

        three.scene.remove(room.build);

        updateOrbitControls(mode);

        three.camera.position.set(0, 0, 5);
        three.camera.rotation.set(0, 0, 0);
        three.camera.lookAt(room.floor!.position);

        room.edgeHandles.forEach(edgeHandle => {
            three.scene.add(edgeHandle);
        });
        room.verticesHandles.forEach(vertexHandle => {
            three.scene.add(vertexHandle);
        });
    }
}



export function disposeWalls(){
    if(room.walls.length > 0){
        room.walls.forEach(roomMesh => {
            roomMesh.geometry.dispose();
            (roomMesh.material as THREE.MeshBasicMaterial).dispose();
            three.scene.remove(roomMesh);
            three.renderer.renderLists.dispose();
        });
        room.walls = [];
    }
}



export function createWalls(){
    disposeWalls();

    room.vertices.forEach((vertex, i) => {

        const v2Index = i === room.vertices.length - 1 ? 0 : i + 1
        const v1 = vertex;
        const v2 = room.vertices[v2Index];

        const length = v1.distanceTo(v2);
        const geometry = new THREE.PlaneGeometry( length, 1 );
        
        const wall = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1,
                depthWrite: false,
                side: THREE.DoubleSide
        }));


        const centerX = (v1.x + v2.x) / 2;
        const centerZ = (v1.y + v2.y) / 2;

        wall.position.set(centerX, 1 * 0.5, centerZ);
        wall.rotation.y = degToRad(-room.edges[i].angleInDeg);

        const edgeV = new THREE.Vector2()
            .subVectors(v2, v1)
            .normalize();

        const outwardNormal = new THREE.Vector3(-edgeV.y, 0, edgeV.x);

        wall.userData.normal = outwardNormal;

        room.walls.push(wall);
        room.build.add(wall)
    });
    three.scene.add(room.build);
}



export function updateOrbitControls(mode: '2D' | '3D'){
    if(mode === '2D'){
        three.controls.enableRotate = false;
        three.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN
        }
    }else{
        three.controls.enableRotate = true;
        three.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        }
    }
}



export function updateVisibleFaces(){
    const faceNormals : THREE.Vector3[] = []; 
    room.walls.forEach(wall => {
        faceNormals.push(wall.userData.normal);
    });
    

    const cubePosition = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const cameraDir = new THREE.Vector3();

    for (let i = 0; i < faceNormals.length; i++) {
        worldNormal.copy(faceNormals[i])
        .transformDirection(room.build.matrixWorld);

        cameraDir.copy(three.camera.position)
        .sub(cubePosition)
        .normalize();

        const facingCamera = worldNormal.dot(cameraDir) > 0;

        const material = room.walls[i].material;

        gsap.to(material, {
            'opacity': facingCamera ? 0.1 : 1,
            duration: 1,
            ease: 'power3.out'
        })
    }
}