const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.setAdminClaim = onCall(async (req) => {
  const uid = req.data.uid;

  if (uid !== undefined && typeof uid == "string") {
    try {
      await admin.auth().setCustomUserClaims(uid, {admin: true});
      return {
        status: "success",
        errMsg: "",
      };
    } catch (e) {
      return {
        status: "error",
        errMsg: e.toString(),
      };
    }
  }
});
