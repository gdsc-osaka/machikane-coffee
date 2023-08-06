import firebase from "firebase/compat";
import FirestoreDataConverter = firebase.firestore.FirestoreDataConverter;
import {assertProduct, Product} from "../redux/product/types";
import {assertShop, Shop} from "../redux/shop/types";

export const productConverter: FirestoreDataConverter<Product> = {
    fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot, options: firebase.firestore.SnapshotOptions): Product {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertProduct(data);
        return data;

    },
    toFirestore(model: Product | Partial<Product>, options?: firebase.firestore.SetOptions): firebase.firestore.DocumentData {
        // データから id を除去
        return model as Omit<Product, "id">;
    }
}

export const shopConverter: FirestoreDataConverter<Shop> = {
    fromFirestore(snapshot: firebase.firestore.QueryDocumentSnapshot, options: firebase.firestore.SnapshotOptions): Shop {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertShop(data);
        return data;

    },
    toFirestore(model: Shop | Partial<Shop>, options?: firebase.firestore.SetOptions): firebase.firestore.DocumentData {
        // データから id を除去
        return model as Omit<Shop, "id">;
    }
}