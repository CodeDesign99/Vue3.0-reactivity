export const svgNS = 'http://www.w3.org/2000/svg'

const doc = (typeof document !== 'undefined' ? document : null) as Document

export const nodeOps = {
    insert: (child: Document, parent: Document, anchor: Node) => {
        parent.insertBefore(child, anchor || null)
    },

    remove: (child: Document) => {
        const parent = child.parentNode
        if (parent) {
            parent.removeChild(child)
        }
    },

    createElement: (tag: string, isSVG: boolean, is: keyof ElementCreationOptions, props: any): Element => {
        const el = isSVG
        ? doc.createElementNS(svgNS, tag)
        : doc.createElement(tag, is ? { is } : undefined)

        if (tag === 'select' && props && props.multiple != null) {
            ;(el as HTMLSelectElement).setAttribute('multiple', props.multiple)
        }

        return el
    },

    createText: (text: string) => doc.createTextNode(text),

    createComment: (text: string) => doc.createComment(text),

    setText: (node: Document, text: string) => {
        node.nodeValue = text
    },

    setElementText: (el: Element, text: string) => {
        el.textContent = text
    },

    parentNode: (node: Document) => node.parentNode as Element | null,

    nextSibling: (node: Document) => node.nextSibling,

    querySelector: (selector: string) => doc.querySelector(selector),

    setScopeId(el: Element, id: string) {
        el.setAttribute(id, '')
    },
}
