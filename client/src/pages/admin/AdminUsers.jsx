import React, { useCallback, useEffect, useState } from "react";
import Title from "../../components/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const ROLES = [
    { value: "user", label: "User", hint: "Can search, book, and list vehicles" },
    { value: "admin", label: "Admin", hint: "Full access, including inviting users" },
];

const AdminUsers = () => {
    const { axios, user: currentUser } = useAppContext();

    const [users, setUsers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [accessRequests, setAccessRequests] = useState([]);
    const [verificationCars, setVerificationCars] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [submitting, setSubmitting] = useState(false);
    const [resendingId, setResendingId] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, invitesRes, requestsRes, verificationRes, reviewsRes] = await Promise.all([
                axios.get("/api/admin/users"),
                axios.get("/api/admin/invitations"),
                axios.get("/api/admin/access-requests"),
                axios.get("/api/admin/vehicle-verifications"),
                axios.get("/api/admin/reviews"),
            ]);
            if (usersRes.data.success) setUsers(usersRes.data.users);
            if (invitesRes.data.success) setInvitations(invitesRes.data.invitations);
            if (requestsRes.data.success) setAccessRequests(requestsRes.data.requests);
            if (verificationRes.data.success) setVerificationCars(verificationRes.data.cars);
            if (reviewsRes.data.success) setReviews(reviewsRes.data.reviews);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("You do not have admin access");
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Sends the invitation email. This is the only way an account gets created -
    // there is no sign-up form in the app.
    const invite = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/admin/invite", { email, role });
            if (data.success) {
                toast.success(data.message);
                setEmail("");
                fetchData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const reviewVehicle = async (carId, status) => {
        try {
            const { data } = await axios.post('/api/admin/vehicle-verifications/review', { carId, status });
            data.success ? (toast.success(data.message), fetchData()) : toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    const moderateReview = async (reviewId, status) => {
        const note = window.prompt(`${status === "hidden" ? "Why is this review being hidden?" : "Optional moderation note:"}`, "");
        if (note === null) return;
        try {
            const { data } = await axios.post(`/api/admin/reviews/${reviewId}/moderate`, { status, note });
            data.success ? (toast.success(data.message), fetchData()) : toast.error(data.message);
        } catch (error) { toast.error(error.message); }
    };

    const reviewRequest = async (requestId, decision) => {
        try {
            const { data } = await axios.post("/api/admin/access-requests/review", { requestId, decision });
            data.success ? toast.success(data.message) : toast.error(data.message);
            if (data.success) fetchData();
        } catch (error) { toast.error(error.response?.data?.message || error.message); }
    };

    const changeRole = async (userId, nextRole) => {
        try {
            const { data } = await axios.post("/api/admin/change-role", { userId, role: nextRole });
            data.success ? toast.success(data.message) : toast.error(data.message);
            if (data.success) fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const removeUser = async (userId, name) => {
        if (!window.confirm(`Remove ${name}? Their vehicles are released and their bookings are deleted.`))
            return;
        try {
            const { data } = await axios.post("/api/admin/remove-user", { userId });
            data.success ? toast.success(data.message) : toast.error(data.message);
            if (data.success) fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const resendInvitation = async (invitationId) => {
        setResendingId(invitationId);
        try {
            const { data } = await axios.post("/api/admin/invitations/resend", { invitationId });
            data.success ? toast.success(data.message) : toast.error(data.message);
            if (data.success) fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setResendingId(null);
        }
    };

    const pending = invitations.filter((invite) => invite.status === "pending");

    return (
        <div className="min-h-screen bg-light px-5 py-12 md:px-12 lg:px-20">
            <Title
                align="left"
                title="Admin Dashboard"
                subTitle="Invite members and manage access across the rental platform"
            />

            <div className="mt-8 max-w-2xl rounded-3xl border border-borderColor bg-white p-6 shadow-[0_18px_50px_rgba(15,118,110,0.08)] md:p-8">
                <h3 className="font-medium text-lg mb-1">Invite a user</h3>
                <p className="text-sm text-gray-500 mb-5">
                    They receive an email with a secure link to set their password. A user account can
                    both book vehicles and list vehicles for others to rent.
                </p>

                <form onSubmit={invite} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm mb-1" htmlFor="invite-email">
                            Email address
                        </label>
                        <input
                            id="invite-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="person@example.com"
                            className="w-full border border-borderColor rounded-lg px-4 py-2.5 outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <span className="block text-sm mb-1">Role</span>
                        <div className="flex flex-col gap-2">
                            {ROLES.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                                        role === option.value
                                            ? "border-primary bg-primary/5"
                                            : "border-borderColor"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={option.value}
                                        checked={role === option.value}
                                        onChange={() => setRole(option.value)}
                                        className="mt-1"
                                    />
                                    <span>
                                        <span className="block font-medium">{option.label}</span>
                                        <span className="block text-xs text-gray-500">
                                            {option.hint}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="cursor-pointer px-8 py-2.5 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Sending..." : "Send invitation"}
                    </button>
                </form>
            </div>

            <div className="mt-10">
                <h3 className="font-medium text-lg mb-3">Vehicle verification queue <span className="text-sm text-gray-500">({verificationCars.length})</span></h3>
                <div className="overflow-x-auto rounded-2xl border border-borderColor bg-white shadow-sm">
                    <table className="w-full text-left"><thead><tr className="border-b border-borderColor"><th className="p-4 font-medium">Vehicle</th><th className="p-4 font-medium">Owner</th><th className="p-4 font-medium">Documents</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium"></th></tr></thead><tbody>
                        {verificationCars.length === 0 ? <tr><td colSpan="5" className="p-5 text-gray-500">No vehicles awaiting review.</td></tr> : verificationCars.map((car) => <tr key={car._id} className="border-b border-borderColor last:border-0"><td className="p-4"><p className="font-medium">{car.brand} {car.model}</p><p className="text-xs text-gray-500">{car.registrationNumber || 'No registration number'}</p></td><td className="p-4">{car.owner?.name}<p className="text-xs text-gray-500">{car.owner?.email}</p></td><td className="p-4">{car.documents?.length || 0} private file(s)</td><td className="p-4 capitalize">{car.verificationStatus}</td><td className="p-4 text-right"><button onClick={() => reviewVehicle(car._id, 'verified')} className="text-green-600 mr-3">Verify</button><button onClick={() => reviewVehicle(car._id, 'rejected')} className="text-red-500">Reject</button></td></tr>)}
                    </tbody></table>
                </div>
            </div>

            <div className="mt-10">
                <h3 className="font-medium text-lg mb-3">Review moderation <span className="text-sm text-gray-500">({reviews.filter((review) => review.status === "hidden").length} hidden)</span></h3>
                <div className="overflow-x-auto rounded-2xl border border-borderColor bg-white shadow-sm">
                    <table className="w-full text-left"><thead><tr className="border-b border-borderColor"><th className="p-4 font-medium">Reviewer</th><th className="p-4 font-medium">Vehicle</th><th className="p-4 font-medium">Review</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium"></th></tr></thead><tbody>
                        {reviews.length === 0 ? <tr><td colSpan="5" className="p-5 text-gray-500">No reviews to moderate.</td></tr> : reviews.map((review) => <tr key={review._id} className="border-b border-borderColor last:border-0 align-top"><td className="p-4"><p className="font-medium">{review.reviewer?.name || "Unknown"}</p><p className="text-xs text-gray-500">{review.reviewer?.email}</p></td><td className="p-4">{review.car?.brand} {review.car?.model}</td><td className="p-4 max-w-sm"><p className="text-accent">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p><p className="mt-1 text-sm text-gray-600">{review.comment}</p>{review.moderationNote && <p className="mt-1 text-xs text-gray-500">Note: {review.moderationNote}</p>}</td><td className="p-4 capitalize">{review.status}</td><td className="p-4 text-right whitespace-nowrap"><button onClick={() => moderateReview(review._id, review.status === "hidden" ? "published" : "hidden")} className={review.status === "hidden" ? "text-green-600" : "text-red-500"}>{review.status === "hidden" ? "Publish" : "Hide"}</button></td></tr>)}
                    </tbody></table>
                </div>
            </div>

            <div className="mt-10">
                <h3 className="font-medium text-lg mb-3">
                    Account requests <span className="text-sm text-gray-500">({accessRequests.filter((request) => request.status === "pending").length} pending)</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-borderColor bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-borderColor"><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Account type</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium"></th></tr></thead>
                        <tbody>
                            {accessRequests.length === 0 ? <tr><td colSpan="5" className="p-5 text-gray-500">No account requests yet.</td></tr> : accessRequests.map((request) => (
                                <tr key={request._id} className="border-b border-borderColor last:border-0">
                                    <td className="p-4">{request.name}</td><td className="p-4 text-gray-500">{request.email}</td><td className="p-4">User</td><td className="p-4 capitalize">{request.status}</td>
                                    <td className="p-4 text-right">{request.status === "pending" && <span className="inline-flex gap-3"><button onClick={() => reviewRequest(request._id, "approve")} className="text-green-600 hover:text-green-700">Approve</button><button onClick={() => reviewRequest(request._id, "reject")} className="text-red-500 hover:text-red-600">Reject</button></span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {pending.length > 0 && (
            <div className="mt-6 max-w-2xl rounded-3xl border border-borderColor bg-white p-6 shadow-sm">
                    <h3 className="font-medium text-lg mb-3">Pending invitations</h3>
                    <div className="flex flex-col gap-2">
                        {pending.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex flex-wrap items-center justify-between gap-3 text-sm border border-borderColor rounded-lg px-4 py-2.5"
                            >
                                <span>{invite.emailAddress}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500">{invite.role.replace("org:", "")}</span>
                                    <button
                                        type="button"
                                        onClick={() => resendInvitation(invite.id)}
                                        disabled={resendingId === invite.id}
                                        className="text-primary hover:text-primary-dull disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {resendingId === invite.id ? "Sending..." : "Resend"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-10">
                <h3 className="font-medium text-lg mb-3">
                    Members <span className="text-sm text-gray-500">({users.length})</span>
                </h3>

                {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-borderColor bg-white shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-borderColor">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((member) => {
                                    const isSelf = member.clerkId === currentUser?.clerkId;
                                    return (
                                        <tr key={member.membershipId} className="border-b border-borderColor last:border-0">
                                            <td className="p-4">
                                                {member.name}
                                                {isSelf && (
                                                    <span className="ml-2 text-xs text-gray-500">you</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-500">{member.email}</td>
                                            <td className="p-4">
                                                <select
                                                    value={member.role}
                                                    disabled={isSelf}
                                                    onChange={(e) => changeRole(member.clerkId, e.target.value)}
                                                    title={isSelf ? "You cannot change your own role" : ""}
                                                    className="border border-borderColor rounded-lg px-3 py-1.5 outline-none focus:border-primary disabled:opacity-50"
                                                >
                                                    {ROLES.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => removeUser(member.clerkId, member.name)}
                                                    disabled={isSelf}
                                                    className="cursor-pointer text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
