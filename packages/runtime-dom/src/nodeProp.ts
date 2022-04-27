import { isOn } from "@vue/shared";
import { patchAttr } from "./modules/attrs";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

export const patchProp = (
    el: Element,
    key: string,
    prevValue: string | null,
    nextValue: Function | string | null,
    isSVG = false
) => {
    switch (key) {
        case 'class':
            patchClass(el, nextValue as (string | null), isSVG)
            break;
        case 'style':
            patchStyle(el, prevValue, nextValue as (string | null))
            break
        default:
            if (isOn(key)) {
                patchEvent(el, key, nextValue as Function)
            } else {
                patchAttr(el, key, nextValue, isSVG)
            }
            break

    }
}
