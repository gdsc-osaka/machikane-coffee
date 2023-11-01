import {onSchedule} from "firebase-functions/lib/v2/providers/scheduler";
import {db} from "./index";
import {logger} from "firebase-functions/lib/v2";
import {ProductForUpdate} from "../../src/modules/redux/product/productTypes";
import {OrderInfoForAdd} from "../../src/modules/redux/info/infoTypes";
import {firestore} from "firebase-admin";
import FieldValue = firestore.FieldValue;

/**
 * 毎日0時に実行されるリセット関数
 * 1. shops/{shopId}/products/{productId} の stock を 0 に設定する
 */
export const onEveryday = onSchedule("every day 00:00", async (e) => {
    const productsRef = db.collectionGroup('products');
    const shopIds: String[] = []; /* productsから得られるデータからshopIdを格納する */

    try {
        const query = await productsRef.get();
        const productRefs = query.docs.map(doc => doc.ref);

        const batch = db.batch();

        for (const productRef of productRefs) {
            batch.update(productRef, {
                stock: 0
            } as ProductForUpdate);

            const shopId = productRef.parent.parent?.id;
            if (shopId) shopIds.push(shopId);
        }

        for (const shopId of shopIds) {
            const orderInfoRef = db.doc(`shops/${shopId}/info/order_info`);

            batch.update(orderInfoRef, {
                last_order_index: 0,
                reset_at: FieldValue.serverTimestamp(),
            } as OrderInfoForAdd)
        }

        try {
            await batch.commit();
            logger.log("Product.stock reset complete.");
        } catch (e) {
            logger.error("Unable to commit batch.", e);
        }

    } catch (e) {
        logger.error("Unable to get products document.", e);
    }
})