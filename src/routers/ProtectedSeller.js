import React from "react";
import useAuth from "../custom-hooks/useAuth";
import useSeller from "../custom-hooks/useSeller";
import { Container, Spinner } from "reactstrap";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedSeller = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { isSeller, isLoading: sellerLoading } = useSeller();
    // Combine loading states
    const isLoading = authLoading || sellerLoading;

    if (isLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    // More comprehensive access check
    const isSellerAccessAllowed = 
        currentUser && 
        (isSeller || 
         currentUser.status === 'seller' || 
         currentUser.role === 'seller' || 
         !!currentUser.sellerId);

    if (!isSellerAccessAllowed) {
        console.warn("Seller Access Denied", {
            currentUser: currentUser ? {
                uid: currentUser.uid,
                email: currentUser.email,
                role: currentUser.role,
                status: currentUser.status,
                sellerId: currentUser.sellerId
            } : null,
            isSeller,
            isSellerAccessAllowed
        });
        
        // Add a toast notification to explain why access is denied
        toast.error("You do not have seller permissions. Please register as a seller.");
        
        return <Navigate to="/home"/>;
    }

    return <Outlet />;
};

export default ProtectedSeller;