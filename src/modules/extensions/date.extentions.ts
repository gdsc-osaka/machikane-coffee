import {Timestamp} from "firebase/firestore";


Date.prototype.addSeconds = function (seconds: number): Date {
    const time = this.getTime() + seconds * 1000; // ミリ秒を秒に直すために　1000 かける
    return new Date(time);
}

Date.prototype.toTimestamp = function (): Timestamp {
    return Timestamp.fromDate(this)
}