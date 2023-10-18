export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/**
 * Redux の Slice で非同期データを扱うときに使う
 */
export type AsyncState<T> = {
    data: T,
    status: AsyncStatus,
    error: string | undefined,
}

export type Unsubscribe = {
    unsubscribe: (() => void) | null
}