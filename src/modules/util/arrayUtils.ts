// export const filterNonNull = <T>(item: T): item is NonNullable<typeof item> => item != null;

declare global {
    interface Array<T> {
        /**
         * 配列の要素のうち, 最初に条件に一致した要素を新しい値に書き換えます. 条件に一致する要素がない場合, 書き換えは発生しません.
         * @param predicate 書き換える要素の探索に使用する条件
         * @param newElement 書き換える値
         */
        update(predicate: (value: T, index: number, obj: T[]) => unknown, newElement: T): Array<T>;
    }
}

// WARNING: if (!Array.prototype.update) この条件要る？要らない？
if (!Array.prototype.update) {
    Array.prototype.update = function<T>(predicate: (value: T, index: number, obj: T[]) => unknown, newElement: T): Array<T> {
        const index = this.findIndex(predicate);

        if (index != -1) {
            this[index] = newElement;
        }

        return this;
    }
}

export {};