import firebase from "firebase/compat";
import FirestoreDataConverter = firebase.firestore.FirestoreDataConverter;
import {assertProduct, Product} from "../redux/product/types";

export const productConverter: FirestoreDataConverter<Product> = {
    fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot, options: firebase.firestore.SnapshotOptions): Product {
        const data = snapshot.data(options);
        assertProduct(data);
        return data;

    },
    toFirestore(model: Product | Partial<Product>, options?: firebase.firestore.SetOptions): firebase.firestore.DocumentData {
        return model;
    }
}