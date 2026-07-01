import { Box3,  Plane, Vector3 } from "three";
import type { RoomState } from "../types/types";

export const s : RoomState = {
    hit: false,
    propToMove: null,
    propToMoveSize: new Vector3(),
    propToMoveBBox : new Box3(),
    activeSurface: null,
    activeSurfaceBBox: new Box3(),
    activeSurfaceSize: new Vector3(),
    isNewPropAdded: false,
    propToMoveCenter: new Vector3(),
    intersectedBBox: new Box3(),
    intersectedMeshSize: new Vector3(),
    dragPlane: new Plane(new Vector3(0, 1, 0), 0),
}


export const r = {
    startX: 0,
    startRotation: 0,
    rotationSpeed : 0.01,
    lastX : 0,
    direction: 0
}