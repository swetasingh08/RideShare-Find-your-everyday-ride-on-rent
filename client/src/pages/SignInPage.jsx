import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const SignInPage = () => {
    const navigate = useNavigate();
    return (
        <main className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden bg-light px-6 py-16">
            <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="mb-8 text-center">
                <div className="text-3xl font-semibold tracking-tight text-gray-800">Ride<span className="text-primary">Share</span></div>
                <h1 className="mt-5 text-3xl font-semibold text-gray-900">Welcome back</h1>
                <p className="mt-2 text-gray-600">Sign in once to book vehicles or list your own.</p>
            </div>
            <SignIn routing="path" path="/sign-in" />
            <button type="button" onClick={() => navigate("/request-access")} className="mt-5 text-sm text-primary">
                New here? Request an account
            </button>
        </main>
    );
};

export default SignInPage;
