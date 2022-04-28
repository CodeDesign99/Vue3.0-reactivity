import { effect } from "@vue/reactivity"
import { isFunction, isObject } from "@vue/shared"

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onCleanup: OnCleanup
) => any

type OnCleanup = (cleanupFn: () => void) => void

export type WatchStopHandle = () => void

export function watch(source: any, cb: WatchCallback, options: any): WatchStopHandle {
    return doWatch(source, cb, options)
}

function doWatch(source: any, cb: WatchCallback, options: any): WatchStopHandle {
    let getter: () => any
    if (isFunction(source)) {
        getter = source
    } else {
        getter = () => travverse(source)
    }

    let oldValue: any, newValue: any

    let cleanup: () => any

    function onInvalidate(fn: () => any) {
        cleanup = fn
    }

    const job = () => {
        newValue = effectFn()
        if (cleanup) {
            cleanup()
        }
        cb(newValue, oldValue, onInvalidate)
        oldValue = newValue
    }

    const effectFn = effect(() => getter(), {
        lazy: true,
        scheduler: () => {
            if (options?.flush === 'post') {
                const p = Promise.resolve()
                p.then(job)
            } else {
                job()
            }
        }
    })

    if (options?.immediate) {
        job()
    } else {
        oldValue = effectFn()
    }

    return () => effectFn.stop()
}

function travverse(value: any, seen = new Set()) {
    if (!isObject(value) || seen.has(value)) {
        return value
    }
    seen.add(value)
    for (const key in value) {
        travverse(value[key], seen)
    }

    return value
}
