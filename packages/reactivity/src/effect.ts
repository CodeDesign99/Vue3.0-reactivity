import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from './operations'

export type optionsType = {
    lazy: boolean;
    scheduler: Function
}
export type effectType<T> = {
    (): T;
    __isEffect: boolean;
    options: optionsType;
    deps: Set<effectType<T>>[];
    stop: () => void
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
function cerateReactiveEffect<T = any>(fn: () => T, options: any = {}) {
    const effect = function reactiveEffect() {
        cleanup(effect)
        activeEffect = effect
        effectStack.push(effect)
        const res = fn()
        effectStack.pop()
        activeEffect = effectStack.at(-1)
        return res
    }
    effect.__isEffect = true
    effect.options = options
    effect.deps = [] as Set<effectType<T>>[]
    effect.stop = () => { }
    return effect
}

function cleanup(effect: effectType<any>) {
    for (let i = 0; i < effect.deps.length; i++) {
        const deps = effect.deps[i]
        deps.delete(effect)
    }
    effect.deps.length = 0
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
        activeEffect.deps.push(dep)
        const effect = activeEffect
        activeEffect.stop = () => {
            dep?.delete(effect)
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
            effects.forEach(effect => {
                if (effect !== activeEffect) {
                    effectsSet.add(effect)
                }
            })
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
        if (effect.options.scheduler) {
            effect.options.scheduler(effect)
        } else {
            effect()
        }
    })
}
