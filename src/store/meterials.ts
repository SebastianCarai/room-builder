import { MeshBasicMaterial, DoubleSide, MeshStandardMaterial } from "three";

export const basicHandleMaterial = new MeshBasicMaterial({
    color: 0xB2BEB5,
    opacity: .5,
    transparent: true
});
export const activeHandleMaterial = new MeshBasicMaterial({color: 0x0000ff});

export const floorMaterial = new MeshStandardMaterial({
    color: 0xffffff, 
    side: DoubleSide
});
export const errorMaterial = new MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: .5
})