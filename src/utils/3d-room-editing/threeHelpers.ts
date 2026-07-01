import { Group, Mesh, MOUSE, Texture, type Material } from "three";
import { three } from "../../store/globalState";

export function removeGroupFromScene(groupToRemove: Group){
    (groupToRemove.traverse((object) => {
        if (!(object instanceof Mesh)) {
            return;
        }

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

        for (const material of materials) {
            disposeMaterial(material);
        }
    }));

    groupToRemove.removeFromParent();
    three.scene.remove(groupToRemove);
}

export function disposeMaterial(material: Material): void {
    for (const value of Object.values(material)) {
        if (value instanceof Texture) {
            value.dispose();
        }
    }

    material.dispose();
}


export function updateOrbitControls(mode: '2D' | '3D'){
    if(mode === '2D'){
        three.controls.enableRotate = false;
        three.controls.mouseButtons = {
            LEFT: MOUSE.PAN
        }
    }else{
        three.controls.enableRotate = true;
        three.controls.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        }
    }
}