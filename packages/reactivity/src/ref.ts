import { hasChanged, isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { reactive } from "./reactive"

export function ref(value: unknown) {
    return reacteRef(value)
}

export function shallowRef(value: unknown) {
    return reacteRef(value, true)
}

const convert = (v: unknown) => isObject(v) ? reactive(v) : v

class RefImpl {
    private _value
    constructor(private rawValue: unknown, private shallow: boolean) {
        this._value = shallow ? rawValue : convert(rawValue)
    }

    get value() {
        track(this, 'get', 'value')
        return this._value
    }

    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            this.rawValue = newValue
            this._value = this.shallow ? newValue : convert(newValue)
            trigger(this, 'set', 'value', newValue)
        }
    }
}

function reacteRef(value: unknown, shallow = false) {
    return new RefImpl(value, shallow)
}


