import express from "express";
import { protect, requireUser } from "../middleware/auth.js";
import { addCar, deleteCar, getDashboardData, getOwnerCars, toggleCarAvailability, updateCar, updateUserImage } from "../controllers/ownerController.js";
import upload from "../middleware/multer.js";

const ownerRouter = express.Router();

// User vehicle-management surface. Admin work lives under /api/admin.
// There is no /change-role route any more - see adminRoutes.
const listingUploads = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 5 }]);
ownerRouter.post("/add-car", listingUploads, protect, requireUser, addCar)
ownerRouter.post("/update-car", listingUploads, protect, requireUser, updateCar)
ownerRouter.get("/cars", protect, requireUser, getOwnerCars)
ownerRouter.post("/toggle-car", protect, requireUser, toggleCarAvailability)
ownerRouter.post("/delete-car", protect, requireUser, deleteCar)

ownerRouter.get('/dashboard', protect, requireUser, getDashboardData)
ownerRouter.post('/update-image', upload.single("image"), protect, requireUser, updateUserImage)

export default ownerRouter;
