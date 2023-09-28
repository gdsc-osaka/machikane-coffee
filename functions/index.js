// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

const { onCall } = require("firebase-functions/v2/https");

// ユーザー権限（管理者）付与
// exports.addAdminClaim = functions.firestore
//   .document("admin_users/{docID}")
//   .onCreate((snap) => {
//     const newAdminUser = snap.data();
//     if (newAdminUser === undefined) {
//       return;
//     }
//     modifyAdmin(newAdminUser.uid, true);
//     // true: 管理者
//   });

// const modifyAdmin = (uid, isAdmin) => {
//   admin.auth().setCustomUserClaims(uid, { admin: isAdmin }).then();
// };

// exports.date = onRequest(
//     {timeoutSeconds: 1200, region: [""]},
//     (req, res) => {
//         const id = req.body.uid;
// });

exports.setAdminClaim = onCall((request) => {
  const uid = request.data.uid;
  // eslint-disable-next-line no-undef
  admin.auth().setCustomUserClaims(uid, { admin: true });
});
