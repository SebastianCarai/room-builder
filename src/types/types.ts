import type { Mesh, Scene, WebGLRenderer, PerspectiveCamera, Vector2, Raycaster, Group, Box3, Vector3, Plane } from "three"
import type { EffectComposer, OrbitControls } from "three/examples/jsm/Addons.js"


export interface ThreeScene{
    canvas: HTMLElement,
    scene: Scene,
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    controls: OrbitControls,
    mouse: Vector2,
    raycaster: Raycaster,
    composer: EffectComposer | null
}

export type Mode = '2D' | '3D';

export interface State{
    mode: Mode,
    isDragging : boolean,
    canRotate : boolean,
    isRotating : boolean,
    isAddingNewProp: boolean,
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


export interface Data2D{
    vertices : Vector2[],
    edges : Edge[],
    edgeHandles : Mesh[],
    edgeToMove : Edge | null,
    verticesHandles : Mesh[],
    vertexToMove : number | null,
}
export interface Data3D{
    floor: Mesh | null,
    walls: Mesh[],
    build: Group,
    buildBBox: Box3,
    props: Group[],
    surfaces: Group[],
    panelItems: HTMLElement[]
}

export interface RoomData extends Data2D, Data3D {};



export interface RoomState{
    hit: boolean,
    propToMove : Group | null,
    propToMoveSize: Vector3,
    propToMoveBBox : Box3,
    activeSurface: Mesh | Group | null,
    activeSurfaceBBox: Box3,
    activeSurfaceSize: Vector3,
    isNewPropAdded: boolean,
    propToMoveCenter: Vector3,
    intersectedBBox: Box3,
    intersectedMeshSize: Vector3,
    dragPlane: Plane
}


export interface CollisionBox {
    bbox: Box3,
    propId: string
}




