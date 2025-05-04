import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
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
const googleProvider = new GoogleAuthProvider();
const getProducts = async () => {
  try {
    const productsCol = collection(db, 'products'); 
    const productSnapshot = await getDocs(productsCol);
    const products = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(), 
    }));
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    throw error; 
  }
};

// Export services
export { auth, db, storage, googleProvider, getProducts };

export default app;