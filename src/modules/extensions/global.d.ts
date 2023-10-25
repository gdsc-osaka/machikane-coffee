import {Timestamp} from "firebase/firestore";

export {};

declare global {
    interface Array<T> {
        /**
         * 配列の要素のうち, 最初に条件に一致した要素を新しい値に書き換えます. 条件に一致する要素がない場合, 要素を追加します
         * @param predicate 書き換える要素の探索に使用する条件
         * @param newElement 書き換える値
         */
        update(predicate: (value: T, index: number, obj: T[]) => unknown, newElement: T): Array<T>;
        remove(predicate: (value: T, index: number, obj: T[]) => unknown): Array<T>;
    }
}

declare global {
    interface Date {
        addSeconds(seconds: number): Date
        toTimestamp(): Timestamp
    }
}