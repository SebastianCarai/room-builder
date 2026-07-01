import { Box3, Vector3 } from "three";
import { room, sizes, state, three } from "../../store/globalState";
import { r, s } from "../../store/roomState";
import { degToRad } from "three/src/math/MathUtils.js";

const bBoxSize = new Vector3();

export function checkRotation(event: MouseEvent){
    let minDistance = 1000000000;

    three.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    three.mouse.y = - (event.clientY / sizes.height) * 2 + 1;
    three.raycaster.setFromCamera(three.mouse, three.camera);

    // Intersect with props and tables
    const intersection = three.raycaster.intersectObjects([...room.props, ...room.surfaces], true);

    if(intersection.length > 0){

        // Update BBox
        const intersect = intersection[0].object.parent || intersection[0].object;
        const intersectBBox = new Box3();
        intersectBBox.setFromObject(intersect).getSize(bBoxSize);
        
        const PI = new Vector3();
        
        // Intersect with BBox
        three.raycaster.ray.intersectBox(intersectBBox, PI);

        // Calculate distance between the intersection point on the BBox and the vertical edges
        const {min, max} = intersectBBox;
        const points = [
            new Vector3(min.x, PI.y, min.z),
            new Vector3(min.x, PI.y, max.z),
            new Vector3(max.x, PI.y, min.z),
            new Vector3(max.x, PI.y, max.z),
        ]
        points.forEach(point=> {
            const distanceToPI = point.distanceTo(PI);
            
            if(distanceToPI < minDistance) minDistance = distanceToPI;
        });


        if(minDistance < .04){
            three.renderer.domElement.classList.add('cursor-rotate');
            state.canRotate = true;
        }else{
            three.renderer.domElement.classList.remove('cursor-rotate');
            state.canRotate = false;
        }
    }
}



let accumulatedRotation = 0;
export function rotateProp(event: MouseEvent){

    const deltaX = event.clientX - r.startX;

    accumulatedRotation = deltaX * 0.01;
    s.propToMove!.rotation.y = Math.round(accumulatedRotation/ degToRad(15)) * degToRad(15);
    s.propToMoveBBox.setFromObject(s.propToMove!, true);
}