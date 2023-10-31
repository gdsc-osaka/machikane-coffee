/**
 * type, interface のフィールドの部分変更をする際に使用. K のフィールドを any に書き換える
 */
export type Weaken<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? any : T[P]
}

/**
 * @see https://stackoverflow.com/questions/56863875/typescript-how-do-you-filter-a-types-properties-to-those-of-a-certain-type
 * @example
 * type Foo = {
 *   narrower: 1;
 *   exact: number;
 *   wider: string | number;
 * }
 *
 * type FooExact = KeysMatchingExact<Foo, number>;
 * // type FooExact = "exact" | "wider"
 */
type KeysMatchingExact<T extends object, V> = {
    [K in keyof T]-?: [V] extends [T[K]] ? K : never
}[keyof T];

