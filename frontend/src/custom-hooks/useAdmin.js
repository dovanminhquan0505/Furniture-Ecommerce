import { useState, useEffect } from "react";
import useAuth from "./useAuth";

const useAdmin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) {
            setIsLoading(true);
            return;
        }

        if (currentUser) {
            setIsAdmin(currentUser.role === "admin");
        } else {
            setIsAdmin(false);
        }
        setIsLoading(false);
    }, [currentUser, authLoading]);

    return { isAdmin, isLoading };
};

export default useAdmin;
