export type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;

export const isObject = (val: unknown): val is Record<any, any> =>
    val !== null && typeof val === 'object'

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

export const isString = (val: unknown): val is string => typeof val === 'string'

export const isFunction = (val: unknown) => typeof val === 'function';

const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

export const isIntegerKey = (key: unknown) =>
    isString(key) &&
    key !== 'NaN' &&
    key[0] !== '-' &&
    '' + parseInt(key, 10) === key

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const hasChanged = (value: any, oldValue: any): boolean =>
    !Object.is(value, oldValue)

export const isArray = Array.isArray

export const extend = Object.assign

export const objectToString = Object.prototype.toString;

export const toTypeString = (value: unknown) => objectToString.call(value);

export const toRawType = (value: unknown) => {
    // extract "RawType" from strings like "[object RawType]"
    return toTypeString(value).slice(8, -1);
};

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
    const cache: Record<string, string> = Object.create(null)
    return ((str: string) => {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    }) as any
}

const camelizeRE = /-(\w)/g
/**
 * @private
 */
export const camelize = cacheStringFunction((str: string): string => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

const hyphenateRE = /\B([A-Z])/g
/**
 * @private
 */
export const hyphenate = cacheStringFunction((str: string) =>
    str.replace(hyphenateRE, '-$1').toLowerCase()
)

/**
 * @private
 */
export const capitalize = cacheStringFunction(
    (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
)

export function includeBooleanAttr(value: unknown): boolean {
    return !!value || value === ''
}

export function makeMap(
    str: string,
    expectsLowerCase?: boolean
): (key: string) => boolean {
    const map: Record<string, boolean> = Object.create(null)
    const list: Array<string> = str.split(',')
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}

const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`
export const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs)
