/**
 * Redux の Slice で非同期データを扱うときに使う
 */
export type AsyncState<T> = {
    data: T,
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: string | null,
}