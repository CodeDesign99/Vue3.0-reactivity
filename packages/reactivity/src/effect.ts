import { isArray, isIntegerKey } from "@vue/shared"

export function effect<T = any>(fn: () => T, options: any = {}) {
    const effect = cerateReactiveEffect(fn, options)

    if (!options.lazy) {
        effect()
    }

    return effect
}


const effectStack: any[] = []
export let activeEffect: () => void
let id = 0
function cerateReactiveEffect<T = any>(fn: () => T, options: any = {}) {
    const effect = function reactiveEffect() {
        try {
            effectStack.push(effect)
            activeEffect = effect
            return fn()
        } finally {
            effectStack.pop()
            activeEffect = effectStack.at(-1)
        }
    }
    effect.id = id++
    effect.__isEffect = true
    effect.options = options
    effect.deps = [] as any[]
    return effect
}

const targetMap = new WeakMap<object, Map<any, Set<() => void>>>()
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
    const effectsTemp = new Set<() => void>()
    const removeDuplicate = (effects: Set<() => void> | undefined) => {
        if (effects) {
            effects.forEach(effect => effectsTemp.add(effect))
        }
    }

    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key > (newValue as number) || key === 'length') {
                removeDuplicate(dep)
            }
        })
    } else {
        removeDuplicate(depsMap.get(key))
        switch (type) {
            case 'add':
                if (isArray(target) && isIntegerKey(key)) {
                    removeDuplicate(depsMap.get('length'))
                }
        }
    }

    effectsTemp.forEach(effect => effect())
}
