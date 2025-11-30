// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC9Q3m9GxnIDY7G23x_imyoJV338Zj3EBU",
    authDomain: "monofamily-7e42e.firebaseapp.com",
    projectId: "monofamily-7e42e",
    storageBucket: "monofamily-7e42e.firebasestorage.app",
    messagingSenderId: "672121344061",
    appId: "1:672121344061:web:f5bae2c9e1746af8dc1a54",
    measurementId: "G-PJVJBNTE2M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const groupsCollection = collection(db, 'groups');
const messagesCollection = (groupId) => collection(db, 'groups', groupId, 'messages');

export { app, db, groupsCollection, messagesCollection };