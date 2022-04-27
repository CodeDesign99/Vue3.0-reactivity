export function patchClass(el: Element, value: string | null, isSVG: boolean) {
    // const transitionClasses = (el as ElementWithTransition)._vtc
    // if (transitionClasses) {
    //     value = (
    //     value ? [value, ...transitionClasses] : [...transitionClasses]
    //     ).join(' ')
    // }
    if (value == null) {
        el.removeAttribute('class')
    } else if (isSVG) {
        el.setAttribute('class', value)
    } else {
        el.className = value
    }
}
