import { MeshBasicMaterial, DoubleSide } from "three";

export const basicHandleMaterial = new MeshBasicMaterial({color: 0xB2BEB5});
export const activeHandleMaterial = new MeshBasicMaterial({color: 0x0000ff});
export const floorMaterial = new MeshBasicMaterial({
    color: 0xffffff, 
    side: DoubleSide
});