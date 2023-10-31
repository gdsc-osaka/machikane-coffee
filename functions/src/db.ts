import {onSchedule} from "firebase-functions/lib/v2/providers/scheduler";
import {firestore} from "./index";
import {logger} from "firebase-functions/lib/v2";

/**
 * 00:00 に shops/{shopId}/products/{productId} の stock を 0 に設定するする
 */
export const resetProductStock = onSchedule("every day 00:00", async (e) => {
    const ref = firestore.collectionGroup('products');

    try {
        const query = await ref.get();
        const productRefs = query.docs.map(doc => doc.ref);

        const batch = firestore.batch();

        for (const productRef of productRefs) {
            batch.update(productRef, {
                stock: 0
            });
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