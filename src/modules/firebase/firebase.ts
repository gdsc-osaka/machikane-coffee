import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./config";

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage();
export default app;