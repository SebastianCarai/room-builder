import { Box3,  Plane, Group, Vector3, type Mesh } from "three"

export interface PropsState{
    panelItems: HTMLElement[]
}

export const propsState : PropsState = {
    panelItems : []
}

interface RoomState{
    hit: boolean,
    propToMove : Mesh | null,
    groupToMove: Group,
    propToMoveSize: Vector3,
    propToMoveBBox : Box3,
    activeSurface: Mesh | null,
    activeSurfaceBBox: Box3,
    activeSurfaceSize: Vector3,
    isNewPropAdded: boolean,
    propToMoveCenter: Vector3,
    intersectedBBox: Box3,
    intersectedMeshSize: Vector3,
    dragPlane: Plane
}

export const s : RoomState = {
    hit: false,
    propToMove: null,
    groupToMove: new Group(),
    propToMoveSize: new Vector3(),
    propToMoveBBox : new Box3(),
    activeSurface: null,
    activeSurfaceBBox: new Box3(),
    activeSurfaceSize: new Vector3(),
    isNewPropAdded: false,
    propToMoveCenter: new Vector3(),
    intersectedBBox: new Box3(),
    intersectedMeshSize: new Vector3(),
    dragPlane: new Plane(new Vector3(0, 1, 0), 0)
}