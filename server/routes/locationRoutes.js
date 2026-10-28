import express from "express";
import { geocode, reverseGeocodeController, route } from "../controllers/locationController.js";

const locationRouter = express.Router();

locationRouter.post("/geocode", geocode);
locationRouter.post("/reverse-geocode", reverseGeocodeController);
locationRouter.post("/route", route);

export default locationRouter;
