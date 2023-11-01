import { initializeApp } from 'firebase-admin';
import {setAdminClaim} from "./auth";
import {onEveryday} from "./db";

const app = initializeApp();

export const auth = app.auth();
export const db = app.firestore();

exports.setAdminClaim = setAdminClaim;
exports.onEveryday = onEveryday;