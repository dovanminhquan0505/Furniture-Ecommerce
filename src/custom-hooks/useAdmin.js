import { useState, useEffect } from "react";
import { auth } from "../firebase.config";

const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setIsAdmin(storedUser.role === "admin");
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, isLoading };
};

export default useAdmin;