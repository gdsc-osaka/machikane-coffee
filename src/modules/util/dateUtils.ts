/**
 * 実行時の日付の 0時0分0秒0ms の Date を取得する
 */
export const getToday = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // 0時0分に合わせる
    return todayDate;
}
export {};