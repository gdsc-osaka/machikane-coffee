export const getSortedObjectKey = (obj: object) => Object.keys(obj)
    .sort((a, b) => a > b ? 1 : -1);