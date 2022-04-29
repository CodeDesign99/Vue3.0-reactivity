import { isObject, extend, isArray, isIntegerKey, hasOwn, hasChanged, isSymbol } from "@vue/shared"
import { ITERATE_KEY, pauseTracking, resetTracking, track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly, toRaw } from "./reactive"
import { TrackOpTypes, TriggerOpTypes } from './operations'

const builtInSymbols = new Set(
    /*#__PURE__*/
    Object.getOwnPropertyNames(Symbol)
        .map(key => (Symbol as any)[key])
        .filter(isSymbol)
)

const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations()

function createArrayInstrumentations() {
    const instrumentations: Record<string, Function> = {}
    // instrument identity-sensitive Array methods to account for possible reactive
    // values
    ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
        instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
            const arr = toRaw(this) as any
            for (let i = 0, l = this.length; i < l; i++) {
                track(arr, TrackOpTypes.GET, i + '')
            }
            // we run the method using the original args first (which may be reactive)
            const res = arr[key](...args)
            if (res === -1 || res === false) {
                // if that didn't work, run it again using raw values.
                return arr[key](...args.map(toRaw))
            } else {
                return res
            }
        }
    })
    // instrument length-altering mutation methods to avoid length being tracked
    // which leads to infinite loops in some cases (#2137)
    ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
        instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
            pauseTracking()
            const res = (toRaw(this) as any)[key].apply(this, args)
            resetTracking()
            return res
        }
    })
    return instrumentations
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target: any, key: string | symbol, receiver: object) {
        if (key === ReactiveFlags.RAW) {
            return target
        }

        if (!isReadonly && isArray(target) && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver)
        }

        const res = Reflect.get(target, key, receiver)

        // 为了避免发生意外的错误，以及性能上的考虑，不在副作用函数与Symbol.iterator这类symbol值之间建立响应联系
        if (!isReadonly && typeof key !== 'symbol') { // 收集依赖
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

        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, TriggerOpTypes.ADD, key, value)
            } else if (hasChanged(oldValue, value)) {
                trigger(target, TriggerOpTypes.SET, key, value, oldValue)
            }
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

function deleteProperty(target: object, key: string | symbol): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
}

function has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key)
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
        track(target, TrackOpTypes.HAS, key)
    }
    return result
}

function ownKeys(target: object): (string | symbol)[] {
    track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
    return Reflect.ownKeys(target)
}

export const mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
}

export const shallowReactiveHandlers = extend(
    {},
    mutableHandlers,
    {
        get: shallowGet,
        set: shallowSet
    }
)

export const readonlyHandlers = {
    get: readonlyGet,
    set(target: any, key: string | symbol) {
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        )
        return true
    },
    deleteProperty(target: any, key: string | symbol) {
        console.warn(
            `Delete operation on key "${String(key)}" failed: target is readonly.`,
            target
        )
        return true
    }
}

export const shallowReadonlyHandlers = extend(
    {},
    readonlyHandlers,
    {
        get: shallowReadonlyGet
    }
)
