import { clerkClient, describeClerkError, organizationId, roleKeys, ALLOWED_ROLES } from "../configs/clerk.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import AccessRequest from "../models/AccessRequest.js";

// Guards every action that provisions or re-roles an account.
const requireOrg = () => {
    if (!organizationId) {
        const error = new Error(
            "CLERK_ORG_ID is not configured. Run `npm run clerk:setup` and paste the printed org id into server/.env."
        );
        error.status = 503;
        throw error;
    }
};

const fail = (res, error) => {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
};

const isValidRole = (role) => ALLOWED_ROLES.includes(role) && Boolean(roleKeys[role]);

const appRoleForClerkRole = (clerkRole) =>
    Object.entries(roleKeys).find(([, roleKey]) => roleKey === clerkRole)?.[0] || null;

export const listAccessRequests = async (req, res) => {
    try {
        const requests = await AccessRequest.find().sort({ status: 1, createdAt: -1 }).lean();
        res.json({ success: true, requests });
    } catch (error) { fail(res, error); }
};

export const listVehicleVerifications = async (req, res) => {
    try { res.json({ success: true, cars: await Car.find({ verificationStatus: { $in: ['pending', 'rejected'] } }).populate('owner', 'name email').sort({ createdAt: -1 }) }); }
    catch (error) { fail(res, error); }
};

export const reviewVehicleVerification = async (req, res) => {
    try {
        const { carId, status } = req.body;
        if (!['verified', 'rejected', 'pending'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid verification status' });
        const car = await Car.findByIdAndUpdate(carId, { verificationStatus: status }, { new: true });
        if (!car) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, message: `Vehicle ${status}`, car });
    } catch (error) { fail(res, error); }
};

export const reviewAccessRequest = async (req, res) => {
    try {
        requireOrg();
        const { requestId, decision, note } = req.body;
        if (!["approve", "reject"].includes(decision)) {
            return res.json({ success: false, message: "Decision must be approve or reject" });
        }
        const request = await AccessRequest.findById(requestId);
        if (!request) return res.json({ success: false, message: "Request not found" });
        if (request.status !== "pending") return res.json({ success: false, message: "This request was already reviewed" });

        if (decision === "approve") {
            await clerkClient.organizations.createOrganizationInvitation({
                organizationId,
                emailAddress: request.email,
                role: roleKeys.user,
                inviterUserId: req.auth.clerkId,
                redirectUrl: process.env.CLERK_INVITE_REDIRECT_URL || undefined,
            });
        }

        request.status = decision === "approve" ? "approved" : "rejected";
        request.reviewedAt = new Date();
        request.reviewedBy = req.auth.clerkId;
        request.reviewNote = (note || "").trim();
        await request.save();
        res.json({ success: true, message: decision === "approve" ? "Request approved and invitation sent" : "Request rejected" });
    } catch (error) {
        fail(res, Object.assign(new Error(describeClerkError(error).message), { status: error.status }));
    }
};

// API to invite a user with a specific role.
// This is the replacement for open registration: no one can create their own
// account, and the admin picks the role before Clerk emails the invite link.
export const inviteUser = async (req, res) => {
    try {
        requireOrg();
        const { email, role } = req.body;
        const emailAddress = (email || "").trim().toLowerCase();
        const adminId = req.auth.clerkId;

        if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
            return res.json({ success: false, message: "A valid email is required" });
        }
        if (!isValidRole(role)) {
            return res.json({
                success: false,
                message: `Role must be one of ${ALLOWED_ROLES.join(", ")}`,
            });
        }

        const invitation = await clerkClient.organizations.createOrganizationInvitation({
            organizationId,
            emailAddress,
            role: roleKeys[role],
            inviterUserId: adminId,
            redirectUrl: process.env.CLERK_INVITE_REDIRECT_URL || undefined,
        });

        res.json({
            success: true,
            message: `Invitation sent to ${emailAddress} as ${role}`,
            invitation: {
                id: invitation.id,
                emailAddress: invitation.emailAddress,
                role: invitation.role,
                status: invitation.status,
            },
        });
    } catch (error) {
        // Clerk returns these when the address is already a member or has a live invite.
        fail(res, Object.assign(new Error(describeClerkError(error).message), { status: error.status }));
    }
};

// API to list org members with their roles
export const listUsers = async (req, res) => {
    try {
        requireOrg();
        const { data = [] } = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId,
            limit: 100,
        });

        const memberships = data.map((membership) => {
            const key = membership.role;
            const appRole = Object.entries(roleKeys).find(([, clerkKey]) => clerkKey === key)?.[0];
            return {
                membershipId: membership.id,
                clerkId: membership.publicUserData?.userId,
                name:
                    membership.publicUserData?.firstName && membership.publicUserData?.lastName
                        ? `${membership.publicUserData.firstName} ${membership.publicUserData.lastName}`
                        : membership.publicUserData?.identifier || "Unknown",
                email:
                    membership.publicUserData?.identifier ||
                    [membership.publicUserData?.firstName, membership.publicUserData?.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                    null,
                role: appRole || "unknown",
                roleKey: key,
            };
        });

        res.json({ success: true, users: memberships });
    } catch (error) {
        fail(res, error);
    }
};

// API to change a member's role
export const changeUserRole = async (req, res) => {
    try {
        requireOrg();
        const { userId, role } = req.body;

        if (!userId) return res.json({ success: false, message: "userId is required" });
        if (!isValidRole(role)) {
            return res.json({
                success: false,
                message: `Role must be one of ${ALLOWED_ROLES.join(", ")}`,
            });
        }

        // Stop an admin from locking the org out by demoting themselves.
        if (userId === req.auth.clerkId && role !== "admin") {
            return res.json({
                success: false,
                message: "You cannot change your own role. Ask another admin to do it.",
            });
        }

        await clerkClient.organizations.updateOrganizationMembership({
            organizationId,
            userId,
            role: roleKeys[role],
        });

        // Mirror immediately so the next API call is already correct.
        await User.findOneAndUpdate({ clerkId: userId }, { role });

        res.json({ success: true, message: `Role updated to ${role}` });
    } catch (error) {
        fail(res, Object.assign(new Error(describeClerkError(error).message), { status: error.status }));
    }
};

// API to remove a member from the organization
export const removeUser = async (req, res) => {
    try {
        requireOrg();
        const { userId } = req.body;

        if (!userId) return res.json({ success: false, message: "userId is required" });
        if (userId === req.auth.clerkId) {
            return res.json({ success: false, message: "You cannot remove yourself" });
        }

        // Resolve the local row first - the cascade below needs its ObjectId.
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.json({ success: false, message: "Member has no local profile" });
        }

        await clerkClient.organizations.deleteOrganizationMembership({
            organizationId,
            userId,
        });

        // Cascade, scoped to this member only: release their cars back to the
        // pool and drop bookings where they were either the renter or the owner.
        await Promise.all([
            Car.updateMany({ owner: user._id }, { $set: { owner: null, isAvaliable: false } }),
            Booking.deleteMany({ $or: [{ user: user._id }, { owner: user._id }] }),
        ]);
        await User.findByIdAndDelete(user._id);

        res.json({ success: true, message: "Member removed" });
    } catch (error) {
        fail(res, Object.assign(new Error(describeClerkError(error).message), { status: error.status }));
    }
};

// API to list pending invitations
export const listInvitations = async (req, res) => {
    try {
        requireOrg();
        const { data = [] } = await clerkClient.organizations.getOrganizationInvitationList({
            organizationId,
            limit: 100,
        });

        res.json({
            success: true,
            invitations: data.map((invite) => ({
                id: invite.id,
                emailAddress: invite.emailAddress,
                role: invite.role,
                status: invite.status,
                createdAt: invite.createdAt,
            })),
        });
    } catch (error) {
        fail(res, error);
    }
};

// Clerk does not provide a separate resend endpoint for organization
// invitations. Replacing a pending invitation creates a fresh delivery link.
export const resendInvitation = async (req, res) => {
    try {
        requireOrg();
        const { invitationId } = req.body;
        if (!invitationId) {
            return res.json({ success: false, message: "invitationId is required" });
        }

        const invitation = await clerkClient.organizations.getOrganizationInvitation({
            organizationId,
            invitationId,
        });
        const role = appRoleForClerkRole(invitation.role);

        if (invitation.status !== "pending" || !role) {
            return res.json({
                success: false,
                message: "Only pending invitations with a valid application role can be resent",
            });
        }

        await clerkClient.organizations.revokeOrganizationInvitation({
            organizationId,
            invitationId,
            requestingUserId: req.auth.clerkId,
        });

        await clerkClient.organizations.createOrganizationInvitation({
            organizationId,
            emailAddress: invitation.emailAddress,
            role: roleKeys[role],
            inviterUserId: req.auth.clerkId,
            redirectUrl: process.env.CLERK_INVITE_REDIRECT_URL || undefined,
        });

        res.json({ success: true, message: `A fresh invitation was sent to ${invitation.emailAddress}` });
    } catch (error) {
        fail(res, Object.assign(new Error(describeClerkError(error).message), { status: error.status }));
    }
};
