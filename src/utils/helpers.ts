import { state } from "../store/globalState";

export function startClickTimer(){
    state.timerStart = Date.now();
}
export function checkClick(){
    let isClick : Boolean = false;
    const endClickTime = Date.now();

    if(endClickTime - state.timerStart < 250) isClick = true;
    
    return isClick;
}