import { isObject, extend, isArray, isIntegerKey, hasOwn, hasChanged } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive, readonly } from "./reactive"
import { TrackOpTypes, TriggerOpTypes } from './operations'

function createGetter(isReadonly = false, shallow = false) {
    return function get(target: any, key: string | symbol, receiver: object) {
        const res = Reflect.get(target, key, receiver)
        if (!isReadonly) { // 收集依赖
            track(target, TrackOpTypes.GET, key)
        }
        if (shallow) {
            return res
        }
        if (isObject(res)) { // 懒递归
           return isReadonly ? readonly(res) : reactive(res)
        }
        return res
    }
}

function createSetter(shallow = false) {
    return function set(target: any, key: string | symbol, value: any, receiver: object) {
        let oldValue = (target as any)[key]

        // 如何判断数组是新增还是修改
        const hadKey = isArray(target) && isIntegerKey(key)
            ? Number(key) < target.length // 数组新增 or 修改
            : hasOwn(target, key)         // 对象新增 or 修改

        const result = Reflect.set(target, key, value, receiver)

        if (!hadKey) {
            trigger(target, TriggerOpTypes.ADD, key, value)
        } else if (hasChanged(oldValue, value)) {
            trigger(target, TriggerOpTypes.SET, key, value, oldValue)
        }
        return result
    }
}

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)
const readonlySet = {
    set(target: any, key: string | symbol) {
        key = typeof key === 'symbol' ? key.toString() : key
        console.warn(`cannot set ${JSON.stringify(target)} on key ${key} falied`)
    }
}

export const mutableHandlers = {
    get,
    set
}

export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}

export const readonlyHandlers = extend({
    get: readonlyGet
}, readonlySet)

export const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet
}, readonlySet)
