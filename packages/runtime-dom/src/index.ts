import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./nodeProp";

const renderOptionDom = extend({ patchProp }, nodeOps)

export {
    renderOptionDom
}
