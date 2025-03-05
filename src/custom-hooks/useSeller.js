import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import { getSellerById, getUserById } from "../api";

const useSeller = () => {
    const [isSeller, setIsSeller] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const checkSellerStatus = async () => {
            setIsLoading(true);

            console.log("Seller Status Check - Initial State:", {
                currentUser: currentUser ? {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    role: currentUser.role,
                    status: currentUser.status,
                    sellerId: currentUser.sellerId
                } : null
            });

            if (currentUser) {
                try {
                    const token =
                        localStorage.getItem("authToken") ||
                        localStorage.getItem("accessToken");
                    if (!token) {
                        console.warn("No authentication token found");
                        setIsSeller(false);
                        setIsLoading(false);
                        return;
                    }

                    // More comprehensive seller status check
                    const isSellerApproved = 
                        currentUser.status === 'seller' || 
                        currentUser.role === 'seller' || 
                        !!currentUser.sellerId;

                    if (currentUser.sellerId) {
                        try {
                            const sellerData = await getSellerById(token, currentUser.sellerId);
                            
                            console.log("Debug - Seller Data:", {
                                status: sellerData.status,
                                role: sellerData.role
                            });

                            const isSellerFullyApproved = 
                                sellerData.status === "approved" && 
                                sellerData.role === "seller";

                            setIsSeller(isSellerFullyApproved);
                        } catch (sellerFetchError) {
                            console.error("Error fetching seller data:", sellerFetchError);
                            setIsSeller(isSellerApproved);
                        }
                    } else {
                        setIsSeller(isSellerApproved);
                    }
                } catch (error) {
                    console.error("Comprehensive Seller Status Check Error:", {
                        message: error.message,
                        stack: error.stack
                    });
                    setIsSeller(false);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsSeller(false);
                setIsLoading(false);
            }
        };

        if (currentUser !== null) {
            checkSellerStatus();
        } else {
            setIsLoading(false);
            setIsSeller(false);
        }
    }, [currentUser]);

    return { isSeller, isLoading };
};

export default useSeller;