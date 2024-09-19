import { useEffect, useState } from "react";
import { db } from "../firebase.config";
import { collection, getDocs } from "firebase/firestore";

// Retrieves data from a specified Firestore collection.
// This hook can be reused throughout a React application to fetch data from different Firestore collections dynamically.
const useGetData = (collectionName) => {
    const [data, setData] = useState([]);
    const collectionRef = collection(db, collectionName);

    useEffect(() => {
        const getData = async () => {
            //Fetch all documents from the Firestore collection using getDocs(collectionRef).
            const data = await getDocs(collectionRef);
            setData(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        };

        getData();
    }, [collectionRef]);
    return { data };
};

export default useGetData;
