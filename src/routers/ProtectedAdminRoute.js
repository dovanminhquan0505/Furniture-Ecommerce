import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import useAuth from "../custom-hooks/useAuth";
import { Container, Spinner } from "react-bootstrap";

const ProtectedAdminRoute = () => {
    const { currentUser } = useAuth();
    const { isAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (!currentUser || !isAdmin) {
        return <Navigate to="/home" />;
    }

    return (
        <>
            <Outlet />
        </>
    );
};

export default ProtectedAdminRoute;
