import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";

const useAdmin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // Check for user role in localStorage
        const userRole = localStorage.getItem('userRole');
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        
        setIsAdmin(userRole === 'admin');
        setIsLoading(false);
    }, []);

    return { isAdmin, isLoading };
};

export default useAdmin;
