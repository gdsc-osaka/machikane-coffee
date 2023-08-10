import {FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue, SnapshotOptions, PartialWithFieldValue, DocumentData, SetOptions} from "firebase/firestore"
import {assertProduct, Product} from "../redux/product/types";
import {assertShop, Shop} from "../redux/shop/types";
import {assertOrder, CargoOrder, Order} from "../redux/order/types";

export const productConverter: FirestoreDataConverter<Product> = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions | undefined): Product {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertProduct(data);
        return data;
    },
    toFirestore(modelObject: WithFieldValue<Product> | PartialWithFieldValue<Product>, options?: SetOptions): any {
        // データから id を除去
        return modelObject as Omit<Product, "id">;
    }
}

export const shopConverter: FirestoreDataConverter<Shop> = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions | undefined): Shop {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertShop(data);
        return data;
    },
    toFirestore(modelObject: WithFieldValue<Shop> | PartialWithFieldValue<Shop>, options?: SetOptions): any {
        // データから id を除去
        return modelObject as Omit<Shop, "id">;
    }
}

export const orderConverter: FirestoreDataConverter<Order> = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions | undefined): Order {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertOrder(data);
        return data;
    },
    toFirestore(modelObject: WithFieldValue<Order> | PartialWithFieldValue<Order>, options?: SetOptions): any {
        return modelObject
    }

}