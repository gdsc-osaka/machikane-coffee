export {};

Array.prototype.update = function<T>(predicate: (value: T, index: number, obj: T[]) => unknown, newElement: T): Array<T> {
    const index = this.findIndex(predicate);

    if (index != -1) {
        this[index] = newElement
    }

    return this;
}

Array.prototype.remove = function<T>(predicate: (value: T, index: number, obj: T[]) => unknown): Array<T> {
    const index = this.findIndex(predicate);
    if (index != -1) {
        this.splice(index, 1);
    }
    return this;
}