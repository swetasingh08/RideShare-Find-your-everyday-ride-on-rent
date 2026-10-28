import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

/**
 * Blocks a subtree until we know who the visitor is.
 *
 * The previous guard redirected from inside useEffect while still rendering the
 * protected children, so deep-linked pages fired their API calls before the
 * redirect landed. This renders nothing until the role is known.
 */
const RequireRole = ({ allow, children }) => {
    const { isLoaded, isUserLoading, user, role } = useAppContext();
    const navigate = useNavigate();

    if (!isLoaded || isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] text-center px-4">
                <h2 className="text-xl font-medium text-gray-700">You need to sign in</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    Accounts are created by invitation. If you were expecting access, ask an
                    administrator to invite this email address.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/sign-in")}
                    className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg"
                >
                    Sign in
                </button>
            </div>
        );
    }

    if (!allow.includes(role)) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] text-center px-4">
                <h2 className="text-xl font-medium text-gray-700">Access denied</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    Your role is <span className="font-medium">{role}</span>. This page needs{" "}
                    <span className="font-medium">{allow.join(" or ")}</span> access. Ask an
                    administrator to change your role.
                </p>
                <Link
                    to="/"
                    className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg"
                >
                    Back to home
                </Link>
            </div>
        );
    }

    return children;
};

export default RequireRole;
