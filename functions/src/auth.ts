import {HttpsError, onCall} from "firebase-functions/lib/v2/providers/https";
import {auth} from "./index";

export const setAdminClaim = onCall(async (req) => {
    const uid = req.data.uid;

    if (uid !== undefined && typeof uid == "string") {
        try {
            await auth.setCustomUserClaims(uid, {admin: true});
            return {
                status: "success",
                errMsg: "",
            };
        } catch (e) {
            return {
                status: "error",
                errMsg: e,
            };
        }
    } else {
        throw new HttpsError(
            'invalid-argument',
            'The function must be called with one argument "uid" containing user\'s uid.'
        );
    }
});