import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../custom-hooks/useAuth";
import { Container, Spinner } from "react-bootstrap";

const ProtectedAdminRoute = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Verifying admin status...</span>
                </Spinner>
            </Container>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (currentUser.role !== "admin") {
        return <Navigate to="/home" replace />;
    }

    return (
        <>
            <Outlet />
        </>
    );
};

export default ProtectedAdminRoute;
