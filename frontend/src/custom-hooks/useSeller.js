import { useEffect, useState } from "react";
import useAuth from "./useAuth";
import { getSellerById } from "../api";

const useSeller = () => {
    const [isSeller, setIsSeller] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const checkSellerStatus = async () => {
            setIsLoading(true);

            if (currentUser) {
                try {
                    const isSellerApproved =
                        currentUser.status === "seller" ||
                        currentUser.role === "seller" ||
                        !!currentUser.sellerId;

                    if (currentUser.sellerId) {
                        try {
                            const sellerData = await getSellerById(currentUser.sellerId);
                            const isSellerFullyApproved =
                                sellerData.status === "approved" && sellerData.role === "seller";
                            setIsSeller(isSellerFullyApproved);
                        } catch (sellerFetchError) {
                            console.error("Error fetching seller data:", sellerFetchError);
                            setIsSeller(isSellerApproved);
                        }
                    } else {
                        setIsSeller(isSellerApproved);
                    }
                } catch (error) {
                    console.error("Comprehensive Seller Status Check Error:", error);
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