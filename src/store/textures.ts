
interface Texture{
    map : string,
    roughnessMap : string,
    normalMap : string
}


export const textures : Record<string, Texture> = {
    'wood' : {
        map : '/textures/wood/wood_Color.jpg',
        roughnessMap : '/textures/wood/wood_Roughness.jpg',
        normalMap : '/textures/wood/wood_Normal.jpg'
    },
    'marble' : {
        map : '/textures/marble/marble_Color.jpg',
        roughnessMap : '/textures/marble/marble_Roughness.jpg',
        normalMap : '/textures/marble/marble_Normal.jpg'
    }
}