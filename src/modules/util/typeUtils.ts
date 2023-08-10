/**
 * type, interface のフィールドの部分変更をする際に使用. K のフィールドを any に書き換える
 */
export type Weaken<T, K extends keyof T> = {
    [P in keyof T]: P extends K ? any : T[P]
}