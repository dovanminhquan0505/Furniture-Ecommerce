import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import { toast } from "react-toastify";
import { getUserById } from "../api";
import { auth } from "../firebase.config";

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setLoading(true);
            try {
                if (user) {
                    const fullUserData = await getUserById(user.uid);
                    const updatedUserData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: fullUserData.username || user.displayName,
                        photoURL: fullUserData.photoURL || user.photoURL,
                        role: fullUserData.role || "user",
                        sellerId: fullUserData.sellerId || null,
                        status: fullUserData.status || "user",
                    };

                    dispatch(userActions.setUser(updatedUserData));
                    setCurrentUser(updatedUserData);
                } else {
                    setCurrentUser(null);
                    dispatch(userActions.clearUser());
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                toast.error("Failed to sync user state: " + error.message);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [dispatch]);

    return { currentUser, loading };
};

export default useAuth;
