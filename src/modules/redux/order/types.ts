import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

export type ProductAmount = {
    [K in string]: number
};

export type Order = {
    product_amount: ProductAmount;
    created_at: Timestamp;
    complete_at: Timestamp;
    received: boolean;
};