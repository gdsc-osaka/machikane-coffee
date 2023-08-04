import firebaseConfig from "./config";
import firebase from "firebase/compat";
import initializeApp = firebase.initializeApp;

const app = initializeApp(firebaseConfig);

export default app;