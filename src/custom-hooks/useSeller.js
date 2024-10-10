import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";

const useSeller = () => {
    const [isSeller, setIsSeller] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const checkSellerStatus = async () => {
            setIsLoading(true);

            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if(userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsSeller(userData.status === "seller");
                    } else {
                        console.warn("User document not found for UID:", currentUser.uid);
                        setIsSeller(false);
                    }
                } catch (error) {
                    console.error("Error fetching user document:", error);
                    setIsSeller(false);
                }
            } else {
                setIsSeller(false);
            }

            setIsLoading(false);
        };

        if(currentUser !== null) {
            checkSellerStatus();
        } else {
            setIsLoading(false);
            setIsSeller(false);
        }
    }, [currentUser]);

    return { isSeller, isLoading };
};

export default useSeller;
