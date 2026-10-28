import express from "express";
import { protect, requireAdmin } from "../middleware/auth.js";
import {
    changeUserRole,
    inviteUser,
    listInvitations,
    listUsers,
    removeUser,
    resendInvitation,
    listAccessRequests,
    reviewAccessRequest,
    listVehicleVerifications,
    reviewVehicleVerification,
} from "../controllers/adminController.js";
import { listReviewsForModeration, moderateReview } from "../controllers/reviewController.js";

const adminRouter = express.Router();

// Every route below is admin-only. protect() verifies the Clerk token first,
// requireAdmin() then checks the org role mirrored onto req.user.
adminRouter.post("/invite", protect, requireAdmin, inviteUser);
adminRouter.get("/users", protect, requireAdmin, listUsers);
adminRouter.get("/access-requests", protect, requireAdmin, listAccessRequests);
adminRouter.post("/access-requests/review", protect, requireAdmin, reviewAccessRequest);
adminRouter.get("/invitations", protect, requireAdmin, listInvitations);
adminRouter.post("/invitations/resend", protect, requireAdmin, resendInvitation);
adminRouter.post("/change-role", protect, requireAdmin, changeUserRole);
adminRouter.post("/remove-user", protect, requireAdmin, removeUser);
adminRouter.get("/vehicle-verifications", protect, requireAdmin, listVehicleVerifications);
adminRouter.post("/vehicle-verifications/review", protect, requireAdmin, reviewVehicleVerification);
adminRouter.get("/reviews", protect, requireAdmin, listReviewsForModeration);
adminRouter.post("/reviews/:id/moderate", protect, requireAdmin, moderateReview);

export default adminRouter;
