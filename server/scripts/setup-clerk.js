/**
 * One-time, re-runnable bootstrap of the Clerk side of the auth system.
 *
 *   npm run clerk:setup
 *
 * Creates (or reuses) a single Clerk Organization, ensures the two custom roles
 * exist, wires them into the instance's initial Role Set, and normalises any
 * pre-Clerk local users to the new role names. Safe to run repeatedly - it looks
 * everything up before creating.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { clerkClient, describeClerkError, roleKeys } from "../configs/clerk.js";
import { databaseUri } from "../configs/db.js";
import { ensureDnsServers } from "../configs/dns.js";
import User from "../models/User.js";

const ORG_NAME = "Car Rental";
const ORG_SLUG = process.env.CLERK_ORG_SLUG || "car-rental";

const log = (msg) => console.log(msg);
const fail = (msg) => {
    console.error(`\nERROR: ${msg}\n`);
    process.exit(1);
};

const requireSecretKey = () => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey || secretKey.includes("replace_me")) {
        fail("CLERK_SECRET_KEY is missing or still a placeholder - add your real key to server/.env");
    }
    return secretKey;
};

const roleKeyToSlug = (key) => key.replace(/^org:/, "");

const reportClerkError = (error, context) => {
    const { status, code, message, traceId } = describeClerkError(error);
    console.error(`\n${context} failed (HTTP ${status ?? "?"}${code ? `, code ${code}` : ""})\n`);
    console.error(`  ${message}`);
    if (traceId) {
        console.error(`\n  Clerk trace id: ${traceId}`);
        console.error("  Include this if you contact Clerk support.");
    }
    console.error("");
};

// Checks the things this script depends on before creating anything, so a
// misconfigured instance produces one clear message instead of a half-built org.
const preflight = async () => {
    try {
        await clerkClient.organizations.getOrganizationList({ limit: 1 });
        log("- organizations feature is available");
    } catch (error) {
        const { isMissingFeature } = describeClerkError(error);
        if (isMissingFeature) {
            console.error("\nThis Clerk instance does not have Organizations enabled yet.");
            console.error("That is required - the admin/user roles are organization roles.");
            console.error("\n  1. Open https://dashboard.clerk.com");
            console.error("  2. Go to Organizations, switch the feature on");
            console.error("  3. Come back and re-run: npm run clerk:setup\n");
            process.exit(1);
        }
        reportClerkError(error, "Preflight check");
        process.exit(1);
    }
};

// --- Organization -----------------------------------------------------------

const ensureOrganization = async () => {
    const existing = await clerkClient.organizations
        .getOrganizationList({ limit: 100 })
        .then((res) => res.data || []);

    const found = existing.find((org) => org.slug === ORG_SLUG || org.name === ORG_NAME);
    if (found) {
        log(`- organization "${found.name}" already exists (${found.id})`);
        return found;
    }

    log(`- creating organization "${ORG_NAME}"...`);
    const created = await clerkClient.organizations.createOrganization({
        name: ORG_NAME,
        slug: ORG_SLUG,
    });
    log(`  created ${created.id}`);
    return created;
};

// --- Roles ------------------------------------------------------------------

const ensureRoles = async () => {
    const existing = await clerkClient.organizationRoles
        .getOrganizationRoleList({ limit: 100 })
        .then((res) => res.data || []);

    const descriptions = {
        [roleKeys.admin]: "Platform admin - invites users and assigns roles",
        [roleKeys.user]: "User - searches, books, and lists vehicles",
    };

    for (const key of Object.values(roleKeys)) {
        const already = existing.find((role) => role.key === key);
        if (already) {
            log(`- role ${key} already exists`);
            continue;
        }
        log(`- creating role ${key}...`);
        await clerkClient.organizationRoles.createOrganizationRole({
            name: roleKeyToSlug(key),
            key,
            description: descriptions[key],
            includeInInitialRoleSet: true,
        });
    }
};

// --- Role Set ---------------------------------------------------------------

// The roles above land in the "initial" role set automatically, but that set has
// to declare which role new members and org creators get. Point them at admin and
// user respectively.
const ensureRoleSet = async () => {
    const roleSets = await clerkClient.roleSets
        .getRoleSetList({ limit: 100 })
        .then((res) => res.data || []);

    const target =
        roleSets.find((set) => set.type === "initial") ||
        roleSets.find((set) => set.key === `role_set:${ORG_SLUG}`);

    if (!target) fail("No initial role set found. Create one in Clerk Dashboard > Organizations > Roles & Permissions.");

    const currentDefault = target.defaultRole?.key;
    const currentCreator = target.creatorRole?.key;

    if (currentDefault === roleKeys.user && currentCreator === roleKeys.admin) {
        log(`- role set "${target.name}" already correct (creator=${currentCreator}, default=${currentDefault})`);
        return target;
    }

    log(`- updating role set "${target.name}" (creator=${roleKeys.admin}, default=${roleKeys.user})...`);
    return clerkClient.roleSets.updateRoleSet({
        roleSetKeyOrId: target.key || target.id,
        creatorRoleKey: roleKeys.admin,
        defaultRoleKey: roleKeys.user,
    });
};

// Existing organization members may still carry the old owner/renter Clerk
// roles. Move them to the unified user role so the Clerk dashboard and token
// claims match the new application model.
const normalizeLegacyMemberships = async (organizationId) => {
    const { data = [] } = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId,
        limit: 100,
    });
    const legacy = data.filter((membership) => ["org:owner", "org:renter", "owner", "renter"].includes(membership.role));
    for (const membership of legacy) {
        const userId = membership.publicUserData?.userId;
        if (!userId) continue;
        await clerkClient.organizations.updateOrganizationMembership({
            organizationId,
            userId,
            role: roleKeys.user,
        });
        log(`- migrated Clerk member ${userId} to ${roleKeys.user}`);
    }
    if (!legacy.length) log("- no legacy Clerk memberships needed migration");
};

// --- Local users ------------------------------------------------------------

// Convert the old owner/renter split to the single user role. Legacy rows that
// already used "user" are also valid after the cutover.
const normalizeLegacyUsers = async () => {
    // This script connects to Mongo itself rather than going through connectDB(),
    // so it has to apply the DNS workaround explicitly - otherwise the SRV lookup
    // for the Atlas host fails with ECONNREFUSED on machines where Node's
    // resolver defaults to loopback.
    ensureDnsServers();

    try {
        await mongoose.connect(databaseUri());
    } catch (error) {
        console.error("\nCould not connect to MongoDB, so legacy users were not migrated.\n");
        console.error(`  ${error.message}\n`);
        if (error.message.includes("ECONNREFUSED") || error.message.includes("querySrv")) {
            console.error("  That is a DNS lookup failure for the Atlas host, not a bad password.");
            console.error("  Check that MONGODB_URI is correct and that this machine can resolve");
            console.error("  <cluster-host>.mongodb.net. Set DNS_SERVERS in server/.env to override.\n");
        }
        // The Clerk side is already committed and idempotent, so this is worth
        // reporting but not worth discarding.
        return false;
    }

    try {
        const result = await User.updateMany({ role: { $in: ["owner", "renter"] } }, { $set: { role: "user" } });
        const orphans = await User.countDocuments({ clerkId: { $exists: false } });
        log(`- migrated ${result.modifiedCount} legacy owner/renter row(s) to "user"`);
        if (orphans) {
            log(`  note: ${orphans} pre-Clerk user row(s) have no clerkId and can no longer sign in.`);
            log("  Their cars/bookings still reference them; delete them if that data is disposable.");
        }
        return true;
    } finally {
        await mongoose.disconnect();
    }
};

// --- Main -------------------------------------------------------------------

const main = async () => {
    requireSecretKey();

    log("Clerk bootstrap\n");

    await preflight();

    const org = await ensureOrganization();
    await ensureRoles();
    const roleSet = await ensureRoleSet();
    await normalizeLegacyMemberships(org.id);
    const localUsersMigrated = await normalizeLegacyUsers();

    log("\nClerk setup complete. Add these to server/.env if they differ:\n");
    log(`CLERK_ORG_ID=${org.id}`);
    log(`CLERK_ROLE_ADMIN=${roleKeys.admin}`);
    log(`CLERK_ROLE_USER=${roleKeys.user}`);
    log(`\nRole set in use: ${roleSet.name} (${roleSet.key || roleSet.id})`);

    if (!localUsersMigrated) {
        log("\nWARNING: the Clerk side succeeded but the local user migration was skipped.");
        log("Legacy owner/renter rows still need to be migrated before they are saved.");
        log("Fix the database connection and re-run this script - it is safe to repeat.");
        return;
    }

    log("\nNow create your first admin in the Clerk Dashboard (Users > Invite user),");
    log("then promote them: Organizations > your org > Members > set role to org:admin");
};

main().catch((error) => {
    reportClerkError(error, "Bootstrap");
    process.exit(1);
});
