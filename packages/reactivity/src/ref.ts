import { hasChanged, IfAny, isArray, isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive } from "./reactive"

declare const RefSymbol: unique symbol

export interface Ref<T = any> {
  value: T
  [RefSymbol]: true
}

export function ref(value: unknown) {
    return reacteRef(value)
}

export function shallowRef(value: unknown) {
    return reacteRef(value, true)
}

const convert = (v: unknown) => isObject(v) ? reactive(v) : v

class RefImpl<T> {
    private _value: T
    public readonly __v_isRef = true
    constructor(private _rawValue: T, private __v_isShallow: boolean) {
        this._value = __v_isShallow ? _rawValue : convert(_rawValue)
    }

    get value() {
        track(this, 'get', 'value')
        return this._value
    }

    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue
            this._value = this.__v_isShallow ? newValue : convert(newValue)
            trigger(this, 'set', 'value', newValue)
        }
    }
}

class ObjectRefImpl<T extends object, K extends keyof T> {
    public readonly __v_isRef = true
    constructor(private _object: T, private _key: K) {
    }

    get value() {
        return this._object[this._key]
    }

    set value(newValue) {
        this._object[this._key] = newValue
    }
}

function reacteRef(value: unknown, shallow = false) {
    return new RefImpl(value, shallow)
}

export type ToRef<T> = IfAny<T, Ref<T>, [T] extends [Ref] ? T : Ref<T>>

export function toRef<T extends object, K extends keyof T>(target: T, key: K) {
    return new ObjectRefImpl(target, key)
}

export type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>
}

export function toRefs<T extends object>(object: T): ToRefs<T> {
    const ret: any = isArray(object) ? new Array(object.length) : {}

    for (const key in object) {
        ret[key] = toRef(object, key)
    }

    return ret
}
