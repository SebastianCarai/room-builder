import * as THREE from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { room, sizes, three } from '../../store/globalState';

let outlinePass : OutlinePass;

export function setupOutlinePass(){
    //Setup outlinePass, configure outlinePass settings, add it to the composer
	outlinePass = getOutlineEffect(window, three.scene, three.camera);
	configureOutlineEffectSettings_Default(outlinePass);
	three.composer!.addPass( outlinePass );
}

export function getOutlineEffect(window : Window, scene: THREE.Scene, camera: THREE.PerspectiveCamera){
    let outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );

    return outlinePass;
}

export function configureOutlineEffectSettings_Default(outlinePass: OutlinePass){

    outlinePass.edgeStrength = 10;
    outlinePass.edgeGlow = .5;
    outlinePass.edgeThickness = 5;
    outlinePass.pulsePeriod = 9;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#ffffff');

}

export function addOutlinesBasedOnIntersections(intersections: any, outlinePass: OutlinePass){

    outlinePass.selectedObjects = [];

    if(intersections.length > 0){
        let firstObject = intersections[0].object.parent as THREE.Group
    
        if(firstObject.uuid){
            outlinePass.selectedObjects = [firstObject];
        }
    }
}


export function checkRayIntersections(mousePointer: THREE.Vector2, camera: THREE.Camera, raycaster: THREE.Raycaster, props: THREE.Object3D[]) {
    raycaster.setFromCamera(mousePointer, camera);

    let intersections = raycaster.intersectObjects(props, true);

    return intersections;
}


export function addHoverGlow(event: MouseEvent) {

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    const intersections = checkRayIntersections(three.mouse, three.camera, three.raycaster, [...room.props, ...room.surfaces]);

    //Add outline on intersections
    addOutlinesBasedOnIntersections(intersections, outlinePass);
}