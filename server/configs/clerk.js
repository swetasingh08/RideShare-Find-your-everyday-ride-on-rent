import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;

if (!secretKey || !publishableKey) {
    throw new Error(
        "CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY must be set in server/.env. See server/.env.example."
    );
}

// One shared client for the whole process. Creating it more than once is wasteful
// and defeats the JWKS cache.
export const clerkClient = createClerkClient({ secretKey, publishableKey });

export const organizationId = process.env.CLERK_ORG_ID;

// Origins permitted to mint tokens for this backend. Without this an attacker who
// obtains a session token on a sibling Clerk app could replay it against us.
export const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const roleKeys = {
    admin: process.env.CLERK_ROLE_ADMIN || "org:admin",
    user: process.env.CLERK_ROLE_USER || "org:user",
};

// Only these values are ever written to User.role, so a stray Clerk role or a
// malformed claim can never escalate anyone.
export const ALLOWED_ROLES = Object.keys(roleKeys);

export const clerkRoleToAppRole = new Map(
    Object.entries(roleKeys).map(([appRole, clerkKey]) => [
        clerkKey,
        appRole,
    ])
);

// Accept the previous Clerk roles during the cutover. Existing members can
// sign in and are mirrored to the single `user` role on their next request.
clerkRoleToAppRole.set("org:owner", "user");
clerkRoleToAppRole.set("org:renter", "user");

// Clerk is inconsistent about the "org:" prefix across token versions: the v1
// `org_role` claim carries it, the v2 `o.rol` claim does not. Normalise both.
export const normalizeRoleKey = (value) =>
    typeof value === "string" && value.trim() ? `org:${value.trim().replace(/^org:/, "")}` : null;

// Clerk's SDK puts the human-readable guidance in `longMessage` and a machine
// readable `code` on each entry of `errors`, while `message` is often a useless
// string like "access denied". Flatten only `message` and you lose the one line
// that tells you what to fix, so always surface these three fields.
const CLERK_ERROR_HINTS = {
    organization_not_enabled_in_instance:
        "Organizations are not enabled on this Clerk instance. Open the Dashboard -> Organizations -> enable Organizations, then re-run this script.",
    organization_feature_not_enabled:
        "Organizations are not enabled on this Clerk instance. Enable them in the Dashboard, then re-run this script.",
    insufficient_permissions:
        "The secret key lacks permission for this operation. Use a full (not restricted) secret key from Dashboard -> API Keys.",
    form_param_missing:
        "A required parameter was missing from the request.",
    role_key_already_exists:
        "That role key already exists on this instance.",
    form_param_invalid:
        "One of the supplied parameters was rejected.",
};

export const describeClerkError = (error) => {
    const detail = error?.errors?.[0] || {};
    const code = detail.code || error?.code;
    const explanation =
        detail.longMessage ||
        error?.longMessage ||
        detail.message ||
        error?.message ||
        "Unknown Clerk error";

    const hint = code ? CLERK_ERROR_HINTS[code] : null;
    const trace = error?.clerkTraceId || error?.clerk_trace_id;

    return {
        status: error?.status,
        code,
        // The library's own wording first, then our interpretation of the code.
        message: hint ? `${explanation}\n\n  -> ${hint}` : explanation,
        traceId: trace,
        isMissingFeature: code === "organization_not_enabled_in_instance",
    };
};
