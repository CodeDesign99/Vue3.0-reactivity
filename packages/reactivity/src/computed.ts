import { isFunction } from "@vue/shared";
import { effect, effectType } from "./effect";

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

class ComputedRefImpl<T> {
    private _value!: T
    public readonly effect: effectType<T>

    public readonly __v_isRef = true

    public _dirty = true
    constructor(getter: ComputedGetter<T>,private readonly _setter: ComputedSetter<T>) {
        this.effect = effect(getter, {
            lazy: true,
            sch: () => {
                if (!this._dirty) {
                    this._dirty = true
                }
            },
            __isComputed: true
        })
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect()
            this._dirty = false
        }
        return this._value
    }

    set value(newValue: T) {
        this._setter(newValue)
    }
}

export function computed(getterOrOptions: any) {
    let getter, setter
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions
        setter = () => {
            console.warn(`computed value must be readonly`)
        }
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    return new ComputedRefImpl(getter, setter)
}
