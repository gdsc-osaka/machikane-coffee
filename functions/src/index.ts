const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getFirestore} = require("firebase-admin/firestore");
const functions = require("firebase-functions");
const logger = functions.logger;

// The Firebase Admin SDK to delete inactive users.
const admin = require("firebase-admin");
admin.initializeApp();

const FieldValue = admin.firestore.FieldValue;
const firestore = getFirestore();

/**
 * 毎日0時に実行されるリセット関数. ただし日本時間に合わせるために UTS:15:00 に設定
 * 1. shops/{shopId}/products/{productId} の stock を 0 に設定する
 * 2. shops/{shopId}/info/order_info の last_order_index を0にし、reset_atを現在時刻にする
 */
// @ts-ignore
exports.onEveryday =  onSchedule("every day 15:00", async (e) => {
    const productsRef = firestore.collectionGroup('products');
    const shopIds: String[] = []; /* productsから得られるデータからshopIdを格納する */

    try {
        const query = await productsRef.get();
        // @ts-ignore
        const productRefs = query.docs.map(doc => doc.ref);

        const batch = firestore.batch();

        for (const productRef of productRefs) {
            batch.update(productRef, {
                stock: 0
            });

            const shopId = productRef.parent.parent?.id;
            if (shopId) shopIds.push(shopId);
        }

        for (const shopId of shopIds) {
            const orderInfoRef = firestore.doc(`shops/${shopId}/info/order_info`);

            batch.update(orderInfoRef, {
                last_order_index: 0,
                reset_at: FieldValue.serverTimestamp(),
            })
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