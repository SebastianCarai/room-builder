import { DoubleSide, Float32BufferAttribute, RepeatWrapping, ShapeGeometry, type Mesh } from "three";
import { panels, room, sizes, t, three } from "../../store/globalState";
import { textures } from "../../store/textures";
import { textureLoader } from "../../store/loaders";

export function handleClick(event : MouseEvent){
    if(event.target !== three.renderer.domElement) return 
    handlePropClik(event)
}

function handlePropClik(event : MouseEvent){
    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / sizes.height) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    const walls = room.walls.filter(wall => wall.userData.isVisible);
    const intersection = three.raycaster.intersectObjects([...walls, room.floor!]);

    if(intersection.length > 0){
        const clickedMesh = intersection[0].object as Mesh;
        if(clickedMesh === room.floor!){
            panels.propsPanel.style.display = 'none';
            panels.texturePanel.style.display = 'flex';

            const texturePanels = Array.from(panels.texturePanel.querySelectorAll('.panel-item')) as HTMLElement[];

            texturePanels.forEach(texturePanel => {
                const texture = texturePanel.dataset.texture;
                texturePanel.addEventListener('click', () => updateMaterial(clickedMesh, texture))
            });
        }
    }else{
        panels.texturePanel.style.display = 'none';
        panels.propsPanel.style.display = 'flex';
    }
}


function updateMaterial(prop: Mesh, texture: string | undefined){
    if(!texture) return;

    updateSurfaceUVs(prop.geometry as ShapeGeometry);

    const selectedTexture = textures[texture];

    const map = textureLoader.load(selectedTexture.map);
    const roughnessMap = textureLoader.load(selectedTexture.roughnessMap);
    const normalMap = textureLoader.load(selectedTexture.normalMap);

    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    roughnessMap.wrapS = RepeatWrapping;
    roughnessMap.wrapT = RepeatWrapping;
    normalMap.wrapS = RepeatWrapping;
    normalMap.wrapT = RepeatWrapping;

    t.newMaterial.map = map;
    t.newMaterial.roughnessMap = roughnessMap;
    t.newMaterial.normalMap = normalMap;
    t.newMaterial.side = DoubleSide

    prop.material = t.newMaterial;
}


function updateSurfaceUVs(geometry: ShapeGeometry){
    const texelSize = 1;
    
    geometry.computeBoundingBox();
    const pos = geometry.attributes.position;
    const uvs = [];
    
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
    
        uvs.push(
            x / texelSize,
            y / texelSize
        );
    }
    
    geometry.setAttribute(
        "uv",
        new Float32BufferAttribute(uvs, 2)
    );
}