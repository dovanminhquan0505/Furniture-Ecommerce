import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userActions } from "../redux/slices/userSlice";
import { toast } from "react-toastify";
import { getUserById } from "../api";
import { auth } from "../firebase.config";

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const reduxUser = useSelector((state) => state.user.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setLoading(true);
            try {
                if (user) {
                    const fullUserData = await getUserById(user.uid);
                    const updatedUserData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: fullUserData.username,
                        photoURL: fullUserData.photoURL,
                        role: fullUserData.role,
                        sellerId: fullUserData.sellerId || null,
                    };

                    dispatch(userActions.setUser(updatedUserData));
                    setCurrentUser(updatedUserData);
                } else {
                    setCurrentUser(null);
                    dispatch(userActions.clearUser());
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                toast.error("Failed to sync user state");
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [dispatch]);

    return { currentUser: reduxUser || currentUser, loading };
};

export default useAuth;
