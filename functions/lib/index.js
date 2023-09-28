
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", { structuredData: true });
//   response.send("Hello from Firebase!");
// });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require("firebase-functions");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require("firebase-admin");
admin.initializeApp();
// ユーザー権限（管理者）付与
exports.addAdminClaim = functions.firestore
    .document("admin_users/{docID}")
    .onCreate((snap) => {
      const newAdminUser = snap.data();
      if (newAdminUser === undefined) {
        return;
      }
      admin.auth().setCustomUserClaims(newAdminUser.uid, {admin: true});
    // true: 管理者
    });
// # sourceMappingURL=index.js.map
