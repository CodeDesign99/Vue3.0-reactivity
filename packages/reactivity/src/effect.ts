import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from './operations'

export type effectType<T> = {
    (): T;
    id: number;
    __isEffect: boolean;
    __isComputed: boolean;
    options: any;
}

export function effect<T = any>(fn: () => T, options: any = {}): effectType<T> {
    const effect = cerateReactiveEffect(fn, options)

    if (!options.lazy) {
        effect()
    }

    return effect
}


const effectStack: any[] = []
export let activeEffect: effectType<any>
let id = 0
function cerateReactiveEffect<T = any>(fn: () => T, options: any = {}) {
    const effect = function reactiveEffect() {
        try {
            if (!effect.__isComputed) {
                effectStack.push(effect)
                activeEffect = effect
            }
            return fn()
        } finally {
            effectStack.pop()
            activeEffect = effectStack.at(-1)
        }
    }
    effect.id = id++
    effect.__isEffect = true
    effect.__isComputed = !!options.__isComputed
    effect.options = options
    effect.raw = fn
    effect.deps = [] as any[]
    return effect
}

const targetMap = new WeakMap<object, Map<any, Set<effectType<any>>>>()
export function track(target: object, type: string, key: unknown) {
    if (activeEffect !== undefined) {
        let depsMap = targetMap.get(target)
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()))
        }
        let dep = depsMap.get(key)
        if (!dep) {
            depsMap.set(key, (dep = new Set()))
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect)
        }
    }
}

export function trigger(target: object, type: string, key?: unknown, newValue?: unknown, oldValue?: unknown) {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const effectsSet = new Set<effectType<any>>()
    const add = (effects: Set<effectType<any>> | undefined) => {
        if (effects) {
            effects.forEach(effect => effectsSet.add(effect))
        }
    }

    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key > (newValue as number) || key === 'length') {
                add(dep)
            }
        })
    } else {
        add(depsMap.get(key))
        switch (type) {
            case TriggerOpTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get('length'))
                }
        }
    }

    effectsSet.forEach(effect => {
        if (effect.options.sch) {
            effect.options.sch()
        }
        effect()
    })
}
