import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

export type Shop = {
    id: string;
    status: "active" | "pause_ordering";
    last_active_time: Timestamp;
};