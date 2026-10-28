import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const AccessRequestPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/user/access-request`, form);
            if (!data.success) return toast.error(data.message);
            setSubmitted(true);
        } catch (error) { toast.error(error.response?.data?.message || "Could not submit your request"); }
        finally { setSubmitting(false); }
    };

    return (
        <main className="relative flex min-h-[75vh] items-center justify-center overflow-hidden bg-light px-6 py-16">
            <div className="pointer-events-none absolute left-10 top-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <section className="relative w-full max-w-lg rounded-3xl border border-borderColor bg-white p-8 shadow-[0_18px_50px_rgba(15,118,110,0.1)] md:p-10">
                {submitted ? <>
                    <h1 className="text-3xl font-semibold text-gray-900">Request received</h1>
                    <p className="mt-3 text-gray-600">An administrator will review your information. If approved, you will receive an invitation by email.</p>
                    <button onClick={() => navigate("/")} className="mt-7 px-6 py-2.5 bg-primary text-white rounded-lg">Back to home</button>
                </> : <>
                    <h1 className="text-3xl font-semibold text-gray-900">Request an account</h1>
                    <p className="mt-2 text-gray-600">Tell us who you are. An administrator will review your request before access is granted.</p>
                    <form onSubmit={submit} className="mt-7 space-y-4">
                        <input required minLength={2} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-borderColor rounded-lg px-4 py-3 outline-none focus:border-primary" />
                        <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-borderColor rounded-lg px-4 py-3 outline-none focus:border-primary" />
                        <p className="rounded-lg bg-light px-4 py-3 text-sm text-gray-600">One account lets you book vehicles and list vehicles for others to rent.</p>
                        <button disabled={submitting} className="w-full px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50">{submitting ? "Submitting..." : "Submit request"}</button>
                    </form>
                </>}
            </section>
        </main>
    );
};

export default AccessRequestPage;
