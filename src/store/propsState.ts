import { Box3, type Mesh } from "three"

export interface PropsState{
    panelItems: HTMLElement[],
    propToAdd : Mesh | null,
    propToAddBBox: Box3,
    isNewPropAdded: boolean
}


export const propsState : PropsState = {
    panelItems : [],
    propToAdd : null,
    propToAddBBox: new Box3(),
    isNewPropAdded: false
}