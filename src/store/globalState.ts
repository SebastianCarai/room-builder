import * as THREE from 'three';
import type { ThreeScene, RoomProps, State } from '../types/types';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export const three : ThreeScene = {
    canvas: document.querySelector('canvas.webgl') as HTMLElement,
    scene : new THREE.Scene(),
    renderer : new THREE.WebGLRenderer(),
    camera : new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
    controls : new OrbitControls(new THREE.PerspectiveCamera(), null),
    mouse : new THREE.Vector2(),
    raycaster : new THREE.Raycaster(),
}

export const state : State = {
    mode: '2D',
    isDragging : false,
    isActionsPanelActive : false,
    timerStart : 0
}

export const room : RoomProps = {
    vertices : [
        new THREE.Vector2(-1, 1),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(1, -1),
        new THREE.Vector2(-1, -1),
    ],
    edges : [],
    edgeHandles : [],
    edgeToMove : null,
    verticesHandles : [],
    vertexToMove : null,
    floor: null,
    walls: null
}

export const actionsPanel = document.querySelector('.actions') as HTMLElement;
export const splitWallButton = document.querySelector('#split-wall') as HTMLElement

