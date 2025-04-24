import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase.config";
import { userActions } from "../../redux/slices/userSlice";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AuthWrapper = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(`${BASE_URL}/auth/check-session`, { 
                    credentials: 'include'  
                });
                if (response.ok) {
                    const userData = await response.json();
                    dispatch(userActions.setUser(userData.user));
                }
            } catch (error) {
                console.error("Error checking session:", error);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                };

                // User is signed in
                const userDocRef = doc(db, "users", user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userFirestoreData = userDoc.data();
                        // Convert all Timestamp fields to ISO strings
                        const serializedData = {};
                        Object.keys(userFirestoreData).forEach((key) => {
                            const value = userFirestoreData[key];
                            if (value && typeof value.toDate === "function") {
                                serializedData[key] = value
                                    .toDate()
                                    .toISOString();
                            } else {
                                serializedData[key] = value;
                            }
                        });

                        // Combine auth user data with Firestore user data
                        dispatch(
                            userActions.setUser({
                                ...userData,
                                ...serializedData,
                            })
                        );
                    } else {
                        dispatch(userActions.setUser(userData));
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    dispatch(userActions.setUser(userData));
                }
            } else {
                // User is signed out
                dispatch(userActions.setUser(null));
            }
        });
        
        checkSession();
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [dispatch]);

    return <>{children}</>;
};

export default AuthWrapper;
