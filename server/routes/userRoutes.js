import express from "express";
import { createAccessRequest, getCars, getNearbyCars, getUserData, updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post('/access-request', createAccessRequest)
userRouter.get('/data', protect, getUserData)
userRouter.put('/profile', protect, updateUserProfile)
userRouter.get('/cars', getCars)
userRouter.get('/cars/nearby', getNearbyCars)

export default userRouter;
