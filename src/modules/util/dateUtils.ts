import { Timestamp } from "firebase/firestore";

declare global {
    interface Date {
        addSeconds(seconds: number): Date
        toTimestamp(): Timestamp
    }
}

Date.prototype.addSeconds = function (seconds: number): Date {
    const time = this.getTime() + seconds * 1000; // ミリ秒を秒に直すために　1000 かける
    return new Date(time);
}

Date.prototype.toTimestamp = function (): Timestamp {
    return Timestamp.fromDate(this)
}

/**
 * 実行時の日付の 0時0分0秒0ms の Date を取得する
 */
export const getToday = () => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // 0時0分に合わせる
    return todayDate;
}
export {};