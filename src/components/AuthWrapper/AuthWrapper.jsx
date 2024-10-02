import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';
import { userActions } from '../../redux/slices/userSlice';

const AuthWrapper = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                const userDocRef = doc(db, "users", user.uid);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        // Combine auth user data with Firestore user data
                        dispatch(userActions.setUser({ ...user, ...userDoc.data() }));
                    } else {
                        dispatch(userActions.setUser(user));
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    dispatch(userActions.setUser(user));
                }
            } else {
                // User is signed out
                dispatch(userActions.setUser(null));
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [dispatch]);

    return <>{children}</>;
};

export default AuthWrapper;