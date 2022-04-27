import { isFunction } from "@vue/shared";
import { effect, effectType, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

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
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true
                }
                trigger(this, TriggerOpTypes.SET, 'value')
            }
        })
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect()
            this._dirty = false
        }
        track(this, TrackOpTypes.GET, 'value')
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
