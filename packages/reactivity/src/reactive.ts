import { isObject, toRawType } from '@vue/shared'
import {
    mutableHandlers,
    readonlyHandlers,
    shallowReactiveHandlers,
    shallowReadonlyHandlers
} from './baseHandlers'
import { Ref } from './ref'

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_SHALLOW = '__v_isShallow',
  RAW = '__v_raw'
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_SHALLOW]?: boolean
  [ReactiveFlags.RAW]?: any
}

const enum TargetType {
    INVALID = 0,
    COMMON = 1,
    COLLECTION = 2
}

type Primitive = string | number | boolean | bigint | symbol | undefined | null
type Builtin = Primitive | Function | Date | Error | RegExp
export type DeepReadonly<T> = T extends Builtin
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer U>
  ? ReadonlySet<DeepReadonly<U>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<DeepReadonly<U>>
  : T extends WeakSet<infer U>
  ? WeakSet<DeepReadonly<U>>
  : T extends Promise<infer U>
  ? Promise<DeepReadonly<U>>
  : T extends Ref<infer U>
  ? Readonly<Ref<DeepReadonly<U>>>
  : T extends {}
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : Readonly<T>

function targetTypeMap(rawType: string) {
    switch (rawType) {
        case 'Object':
        case 'Array':
            return TargetType.COMMON /* COMMON */;
        case 'Map':
        case 'Set':
        case 'WeakMap':
        case 'WeakSet':
            return TargetType.COLLECTION /* COLLECTION */;
        default:
            return TargetType.INVALID /* INVALID */;
    }
}
function getTargetType(value: any) {
    return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
        ? TargetType.INVALID /* INVALID */
        : targetTypeMap(toRawType(value));
}

export function reactive(target: object) {
    return createReactiveObject(target, false, mutableHandlers)
}

export function shallowReactive<T extends object>(target: T) {
    return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly<T extends object>(target: T) {
    return createReactiveObject(target, true, readonlyHandlers)
}
export function shallowReadonly<T extends object>(target: T) {
    return createReactiveObject(target, true, shallowReadonlyHandlers)
}

/**
 * @param target 代理对象
 * @param isReadonly 是否只读
 * @param baseHandler 针对不同方式创建不同的代理对象
 */
const reactiveMap = new WeakMap<Target, any>()
const readonlyMap = new WeakMap<Target, any>()
function createReactiveObject(target: Target, isReadonly: boolean, baseHandler: object) {
    if (!isObject(target)) {
        console.warn(`value cannot be made reactive: ${String(target)}`)
        return target
    }

    const proxyMap = isReadonly ? readonlyMap : reactiveMap
    const existingProxy = proxyMap.get(target)
    if (existingProxy) {
        return existingProxy
    }

    const targetType = getTargetType(target)
    if (targetType === 0) {
        return target
    }

    const proxy = new Proxy(target, baseHandler)
    proxyMap.set(target, proxy)

    return proxy
}

export function toRaw<T>(observed: T): T {
    return observed && (observed as Target)[ReactiveFlags.RAW]
}
