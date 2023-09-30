const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.setAdminClaim = onCall((data) => {
  const uid = data.uid;
  //   console.log(data);
  //   console.log(uid);
  // const uid = "B9HB7lHbbzeWaRyMj0SSaEsJqkK2";

  // eslint-disable-next-line no-undef
  admin.auth().setCustomUserClaims(uid, {admin: true});
});
