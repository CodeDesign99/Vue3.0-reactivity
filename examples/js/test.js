let { reactive,
    shallowReactive,
    readonly,
    shallowReadonly,
    effect,
    ref,
    toRef,
    toRefs,
    computed,
    watch,
    watchEffect
} = VueRuntimeCore

var obj = {}
var proto = { bar: 1 }
var child = reactive(obj)
var parent = reactive(proto)

Object.setPrototypeOf(child, parent)

effect(() => {
    console.log('child', child.bar)
})

document.addEventListener('click', () => {
    child.bar++
})

var arr = reactive([])

effect(() => {
    arr.push(1)
})

effect(() => {
    arr.push(1)
})
