import { verifyToken } from "@clerk/backend";
import User from "../models/User.js";
import {
    ALLOWED_ROLES,
    authorizedParties,
    clerkClient,
    clerkRoleToAppRole,
    normalizeRoleKey,
    organizationId,
} from "../configs/clerk.js";

// Pull the organization role out of a verified Clerk session token.
// v1 tokens expose `org_role`, v2 tokens nest it under `o.rol`.
const readOrgRole = (claims) => {
    const candidates = [claims.orgRole, claims.org_role, claims.o?.rol];
    for (const candidate of candidates) {
        const key = normalizeRoleKey(candidate);
        const appRole = key ? clerkRoleToAppRole.get(key) : null;
        if (appRole) return appRole;
    }
    return null;
};

// The `o` claim only exists while an organization is ACTIVE on the frontend.
// Until the client pins one, a genuine org admin would look role-less and be
// provisioned as a regular user, locking them out of /api/admin. So fall back to
// asking Clerk directly.
//
// Results are cached briefly because this runs per request while the org claim
// is absent, and each miss is a network call to Clerk.
const ROLE_CACHE_TTL_MS = 60_000;
const roleCache = new Map();
const profileCache = new Map();

const readableNameFromEmail = (email) => {
    const localPart = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+$/g, '').trim();
    return localPart ? localPart.replace(/\b\w/g, character => character.toUpperCase()) : 'Profile';
};

const resolveRoleFromMembership = async (clerkId) => {
    if (!organizationId) return null;

    const cached = roleCache.get(clerkId);
    if (cached && Date.now() - cached.at < ROLE_CACHE_TTL_MS) return cached.role;

    let role = null;
    try {
        const { data = [] } = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId,
            userId: [clerkId],
            limit: 1,
        });
        const membership =
            data.find((entry) => entry.publicUserData?.userId === clerkId) || data[0];
        if (membership) {
            role = clerkRoleToAppRole.get(normalizeRoleKey(membership.role)) || null;
        }
    } catch (error) {
        // Never fail the request over this - fall back to the mirrored role.
        console.error("Could not resolve Clerk organization role:", error.message);
        return null;
    }

    roleCache.set(clerkId, { role, at: Date.now() });
    return role;
};

const resolveClerkProfile = async (clerkId, claims) => {
    const cached = profileCache.get(clerkId);
    if (cached && Date.now() - cached.at < ROLE_CACHE_TTL_MS) return cached.profile;

    const claimEmail = claims.email || claims.email_address || '';
    const claimName = [claims.name, [claims.given_name, claims.family_name].filter(Boolean).join(" "), claims.username]
        .find(value => typeof value === "string" && value.trim() && !value.includes('@'));
    const fallback = {
        name: claimName?.trim() || readableNameFromEmail(claimEmail),
        email: claimEmail || `${clerkId}@clerk.local`,
        phone: claims.phone_number || "",
    };

    try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.find(item => item.id === clerkUser.primaryEmailAddressId)?.emailAddress;
        const primaryPhone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers?.find(item => item.id === clerkUser.primaryPhoneNumberId)?.phoneNumber;
        const profile = {
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || clerkUser.username || readableNameFromEmail(primaryEmail || fallback.email) || fallback.name,
            email: primaryEmail || fallback.email,
            phone: primaryPhone || fallback.phone,
        };
        profileCache.set(clerkId, { profile, at: Date.now() });
        return profile;
    } catch (error) {
        console.error("Could not resolve Clerk profile:", error.message);
        profileCache.set(clerkId, { profile: fallback, at: Date.now() });
        return fallback;
    }
};

const unauthorized = (res, message) => res.status(401).json({ success: false, message });

// Verifies the Clerk session token and attaches the matching local user to req.
// Replaces the old JWT implementation, which used jwt.decode() and therefore
// never checked the signature.
export const protect = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return unauthorized(res, "not authorized");

    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
    if (!token) return unauthorized(res, "not authorized");

    let claims;
    try {
        const result = await verifyToken(token, {
            jwtKey: process.env.CLERK_JWT_KEY || undefined,
            secretKey: process.env.CLERK_SECRET_KEY,
            authorizedParties,
        });
        if (result.errors?.length) throw result.errors[0];
        // Clerk's current public export keeps its legacy return shape and
        // returns the payload directly. Keep .data as a fallback for SDKs
        // configured to return the newer result object.
        claims = result.data || result;
    } catch (error) {
        const reason = error?.longMessage || error?.message || "invalid token";
        return res.status(401).json({ success: false, message: `not authorized: ${reason}` });
    }

    const clerkId = claims?.sub;
    if (!clerkId) return unauthorized(res, "not authorized");

    try {
        // Clerk organization membership is the access boundary. A session for
        // this Clerk instance alone must not become a regular user account.
        const membershipRole = await resolveRoleFromMembership(clerkId);
        const orgRole = membershipRole || readOrgRole(claims);
        if (!orgRole) {
            return res.status(403).json({
                success: false,
                message: "forbidden: this account is not assigned to the vehicle-rental organization",
            });
        }

        // Provision the local mirror row on first authenticated request, so an
        // invite that has been accepted but never browsed still works.
        let user = await User.findOne({ clerkId });
        const profile = await resolveClerkProfile(clerkId, claims);
        const email = profile.email;

        if (!user) {
            // Email is the stable identity across a Clerk account migration.
            // Reuse an existing row even when it has an older Clerk ID; otherwise
            // User.create() collides with the unique email_1 index.
            const existingByEmail = email ? await User.findOne({ email }) : null;

            if (existingByEmail) {
                user = existingByEmail;
                user.clerkId = clerkId;
                if (!user.profileCompleted && (!user.name || user.name === user.email || /^new\s+user$/i.test(user.name))) user.name = profile.name;
                if (profile.phone && !user.phone) user.phone = profile.phone;
                await user.save();
            } else {
                try {
                    user = await User.create({
                        clerkId,
                        name: profile.name,
                        email,
                        phone: profile.phone,
                        role: orgRole,
                    });
                } catch (error) {
                    // Two tabs can authenticate the same new user at once. One
                    // request may win the insert while the other receives the
                    // unique-index error; reuse the row created by the winner.
                    if (error?.code !== 11000) throw error;
                    user = await User.findOne({ $or: [{ clerkId }, { email }] });
                    if (!user) throw error;
                    if (user.clerkId !== clerkId) {
                        user.clerkId = clerkId;
                        await user.save();
                    }
                }
            }
        }

        const shouldUpdateName = !user.profileCompleted && profile.name && user.name !== profile.name;
        const shouldUpdateEmail = profile.email && profile.email !== user.email;
        const shouldUpdatePhone = !user.profileCompleted && profile.phone && profile.phone !== user.phone;
        if (shouldUpdateName) user.name = profile.name;
        if (shouldUpdatePhone) user.phone = profile.phone;
        if (shouldUpdateEmail) {
            const emailOwner = await User.findOne({ email: profile.email, _id: { $ne: user._id } }).select("_id");
            if (!emailOwner) user.email = profile.email;
        }

        // Keep the mirrored role in step with Clerk so a role change in the
        // dashboard takes effect without waiting for the next invite cycle.
        // Clerk is the source of truth, so this also corrects a legacy row's role.
        if (orgRole && orgRole !== user.role) {
            user.role = orgRole;
            await user.save();
        }

        req.auth = { clerkId, claims, orgRole };
        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Public features such as vehicle search can still use an authenticated
// identity when one exists, while guests continue with a local session.
export const optionalProtect = async (req, res, next) => {
    if (!req.headers.authorization) return next();
    return protect(req, res, next);
};

// Route-level authorisation. Must run after protect(), so req.user.role is trusted.
export const requireRole = (...allowed) => {
    const permitted = new Set(allowed);

    return (req, res, next) => {
        if (!req.user) return unauthorized(res, "not authorized");

        const role = req.user.role;
        if (!ALLOWED_ROLES.includes(role) || !permitted.has(role)) {
            return res.status(403).json({
                success: false,
                message: `forbidden: this action requires ${[...permitted].join(" or ")} access`,
            });
        }
        next();
    };
};

export const requireAdmin = requireRole("admin");

export const requireUser = requireRole("user");

export const isOrganizationConfigured = () => Boolean(organizationId);
