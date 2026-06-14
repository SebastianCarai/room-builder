import type { Mesh, Scene, WebGLRenderer, PerspectiveCamera, Vector2, Raycaster } from "three"
import type { OrbitControls } from "three/examples/jsm/Addons.js"


export interface ThreeScene{
    canvas: HTMLElement,
    scene: Scene,
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    controls: OrbitControls,
    mouse: Vector2,
    raycaster: Raycaster,
}

export interface State{
    isDragging : boolean,
    isActionsPanelActive : boolean,
    timerStart : number
}

export interface Edge{
    id: number,
    startIndex: number,
    endIndex: number,
    handle?: number,
    angleInDeg: number,
    direction: 'x' | 'y'
}

export interface RoomProps{
    vertices : Vector2[],
    edges : Edge[],
    edgeHandles : Mesh[],
    edgeToMove : Edge | null,
    verticesHandles : Mesh[],
    vertexToMove : number | null,
}




