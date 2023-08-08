import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

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

export {};