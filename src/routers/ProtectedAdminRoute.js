import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAdmin from "../custom-hooks/useAdmin";
import useAuth from "../custom-hooks/useAuth";

const ProtectedAdminRoute = () => {
    const { currentUser } = useAuth();
    const { isAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return <div className="fw-bold text-center">Loading...</div>;
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
