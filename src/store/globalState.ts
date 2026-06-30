import * as THREE from 'three';
import type { ThreeScene, RoomData, State, Mode } from '../types/types';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const state : State = {
    mode: '3D',
    isDragging : false,
    isAddingNewProp: false,
    isActionsPanelActive : false,
    timerStart : 0
}

export let panelWidth = state.mode === '3D' ? parseInt(window.getComputedStyle(document.body).getPropertyValue('--props-panel-width').split('px')[0]) : 0;

export function setPanelWidthFromMode(mode : Mode) {
    panelWidth = mode === '3D' 
    ? parseInt(window.getComputedStyle(document.body).getPropertyValue('--props-panel-width').split('px')[0]) 
    : 0;
}

export const sizes = {
    width: window.innerWidth - panelWidth,
    height: window.innerHeight
}

export const three : ThreeScene = {
    canvas: document.querySelector('canvas.webgl') as HTMLElement,
    scene : new THREE.Scene(),
    renderer : new THREE.WebGLRenderer(),
    camera : new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000),
    controls : new OrbitControls(new THREE.PerspectiveCamera(), null),
    mouse : new THREE.Vector2(),
    raycaster : new THREE.Raycaster(),
    composer: null
}

export const room : RoomData = {
    panelItems : [],
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
    walls: [],
    build: new THREE.Group(),
    buildBBox: new THREE.Box3(),
    props: [],
    surfaces: []
}

export const actionsPanel = document.querySelector('.actions') as HTMLElement;

