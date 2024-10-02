import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";

const useAdmin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const checkAdminStatus = async () => {
            setIsLoading(true);
            
            if (currentUser) {
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsAdmin(userData.role === "admin");
                    } else {
                        console.warn("User document not found for UID:", currentUser.uid);
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error fetching user document:", error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            
            setIsLoading(false);
        };

        if (currentUser !== null) {
            checkAdminStatus();
        } else {
            setIsLoading(false);
            setIsAdmin(false);
        }
    }, [currentUser]);

    return { isAdmin, isLoading };
};

export default useAdmin;
