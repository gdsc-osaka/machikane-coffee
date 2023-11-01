import { initializeApp } from 'firebase-admin';
import {setAdminClaim} from "./auth";
import {resetProductStock} from "./db";

const app = initializeApp();

export const auth = app.auth();
export const firestore = app.firestore();

exports.setAdminClaim = setAdminClaim;
exports.resetProductStock = resetProductStock;