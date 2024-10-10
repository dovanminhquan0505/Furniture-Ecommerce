import React from "react";
import useAuth from "../custom-hooks/useAuth";
import useSeller from "../custom-hooks/useSeller";
import { Container, Spinner } from "reactstrap";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedSeller = () => {
    const { currentUser } = useAuth();
    const { isSeller, isLoading } = useSeller();

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

    if(!isSeller || !currentUser) {
        return <Navigate to="/home"/>
    }

    return (
        <>
            <Outlet />
        </>
    )
};

export default ProtectedSeller;
