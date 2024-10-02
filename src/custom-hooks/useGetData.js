import { useEffect, useState } from "react";
import { db } from "../firebase.config";
import { collection, onSnapshot } from "firebase/firestore";

// Retrieves data from a specified Firestore collection.
// This hook can be reused throughout a React application to fetch data from different Firestore collections dynamically.
const useGetData = (collectionName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    //By using this function(onSnapShot), don't need to manually refresh or reload the data; the app stays in sync automatically.
    useEffect(() => {
        const collectionRef = collection(db, collectionName); 

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            setData(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName]);

    return { data, loading };
};

export default useGetData;
