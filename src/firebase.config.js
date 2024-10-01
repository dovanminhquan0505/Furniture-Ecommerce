import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdD6bwFBYyTOikoF-oHrYvPTWrRH-gqeQ",
  authDomain: "furniture-ecommerce-435809.firebaseapp.com",
  projectId: "furniture-ecommerce-435809",
  storageBucket: "furniture-ecommerce-435809.appspot.com",
  messagingSenderId: "30774510831",
  appId: "1:30774510831:web:a44a0d5bbdcd096733071a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services
export { auth, db, storage };

export default app;