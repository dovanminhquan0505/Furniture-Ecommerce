import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        // Check for JWT token in localStorage
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        
        if (authToken && userData) {
            setCurrentUser(userData);
            dispatch(userActions.setUser(userData));
            console.log("Auth initialized from localStorage:", userData);
        } else {
            setCurrentUser(null);
            dispatch(userActions.setUser(null));
        }
        
        setLoading(false);
    }, [dispatch]);

    return { currentUser, loading };
};

export default useAuth;
