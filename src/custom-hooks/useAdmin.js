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
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if(userData && typeof userData.role === "string") {
                        setIsAdmin(userData.role === "admin");
                    } else {
                        setIsAdmin(false);
                    }
                }
            } else {
                setIsAdmin(false);
            }
            setIsLoading(false);
        };

        checkAdminStatus();
    }, [currentUser]);

    return { isAdmin, isLoading };
};

export default useAdmin;
