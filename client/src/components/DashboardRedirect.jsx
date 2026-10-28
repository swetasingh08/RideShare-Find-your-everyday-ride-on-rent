import React from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const destinations = {
    admin: "/admin",
    user: "/owner",
};

const DashboardRedirect = () => {
    const { isLoaded, isUserLoading, user, role } = useAppContext();

    if (!isLoaded || isUserLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center text-gray-500">Loading...</div>;
    }

    if (!user) return <Navigate to="/sign-in" replace />;
    return <Navigate to={destinations[role] || "/"} replace />;
};

export default DashboardRedirect;
