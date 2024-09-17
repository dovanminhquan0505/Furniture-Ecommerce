import React, { useState } from "react";
import useAuth from "../custom-hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    if (loading)
        return (
            <div className="text-center">
                <h5 className="fw-bold">Loading...</h5>
            </div>
        );

    return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
