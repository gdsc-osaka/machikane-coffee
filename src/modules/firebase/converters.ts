import {FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue, SnapshotOptions, PartialWithFieldValue, DocumentData, SetOptions} from "firebase/firestore"
import {assertProduct, Product} from "../redux/product/types";
import {assertShop, Shop} from "../redux/shop/types";
import {assertOrder, CargoOrder, Order} from "../redux/order/types";
import {Weaken} from "../util/typeUtils";

export const productConverter: FirestoreDataConverter<Product> = {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options: SnapshotOptions | undefined): Product {
        // データに id を付加
        const data = {...snapshot.data(options), id: snapshot.id};
        assertProduct(data);
        return data;
    },
    toFirestore(modelObject: WithFieldValue<Product> | PartialWithFieldValue<Product>, options?: SetOptions): any {
        // データから Firestore に保存しないものを除去
        const weakenModel: Weaken<WithFieldValue<Product> | PartialWithFieldValue<Product>, "id" | "thumbnail_url"> = modelObject;
        delete weakenModel.id;
        delete weakenModel.thumbnail_url;
        return weakenModel;
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
        const weakenModel: Weaken<WithFieldValue<Shop> | PartialWithFieldValue<Shop>, "id"> = modelObject;
        delete weakenModel.id;
        return weakenModel;
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
        // データから id を除去
        const weakenModel: Weaken<WithFieldValue<Order> | PartialWithFieldValue<Order>, "id"> = modelObject;
        delete weakenModel.id;
        return weakenModel;
    }

}