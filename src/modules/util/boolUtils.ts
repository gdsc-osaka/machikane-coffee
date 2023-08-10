export const xor = (a: boolean, b: boolean) => {
    return ( a || b ) && !( a && b );
}