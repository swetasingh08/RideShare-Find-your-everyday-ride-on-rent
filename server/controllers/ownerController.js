import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";
import { normalizeCoordinates } from "../services/locationService.js";

const uploadFiles = async (files, folder) => Promise.all((files || []).map(async (file) => {
    const response = await imagekit.upload({ file: fs.readFileSync(file.path), fileName: file.originalname, folder });
    return imagekit.url({ path: response.filePath, transformation: [{ quality: 'auto' }] });
}));


// API to List Car
// Note: the old changeRoleToOwner endpoint is gone. Roles are assigned by an
// admin through /api/admin/invite or /api/admin/change-role, never by the user.

export const addCar = async (req, res)=>{
    try {
        const {_id} = req.user;
        let car = JSON.parse(req.body.carData);
        const coordinates = normalizeCoordinates(car.coordinates);
        if (!coordinates) return res.status(400).json({ success: false, message: "Valid pickup latitude and longitude are required" });
        car.coordinates = coordinates;
        car.instantBooking = false;
        car.approvalRequired = true;
        const imageFiles = req.files?.images || [];
        if (imageFiles.length < 4 || imageFiles.length > 10) return res.status(400).json({ success: false, message: "Upload between 4 and 10 vehicle photos" });

        // Upload Image to ImageKit
        const uploadedImages = await Promise.all(imageFiles.map(async (imageFile) => {
            const response = await imagekit.upload({ file: fs.readFileSync(imageFile.path), fileName: imageFile.originalname, folder: '/cars' });
            return imagekit.url({ path: response.filePath, transformation: [{width: '1280'}, {quality: 'auto'}, {format: 'webp'}] });
        }));

        // optimization through imagekit URL transformation
        const documentFiles = req.files?.documents || [];
        const documentUrls = await uploadFiles(documentFiles, '/car-documents');
        const documents = documentUrls.map((url, index) => ({ documentType: req.body.documentTypes?.split(',')[index] || 'Supporting document', url }));
        await Car.create({...car, owner: _id, image: uploadedImages[0], images: uploadedImages, documents, verificationStatus: 'pending'})

        res.json({success: true, message: "Vehicle added"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to List Owner Cars
export const getOwnerCars = async (req, res)=>{
    try {
        const {_id} = req.user;
        const cars = await Car.find({owner: _id })
        res.json({success: true, cars})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

export const updateCar = async (req, res) => {
    try {
        const carData = JSON.parse(req.body.carData);
        const car = await Car.findOne({ _id: req.body.carId, owner: req.user._id });
        if (!car) return res.status(404).json({ success: false, message: "Vehicle not found" });
        if (carData.coordinates !== undefined) {
            const coordinates = normalizeCoordinates(carData.coordinates);
            if (!coordinates) return res.status(400).json({ success: false, message: "Valid pickup latitude and longitude are required" });
            carData.coordinates = coordinates;
        }
        const allowed = Object.keys(Car.schema.paths).filter((key) => !['_id', 'owner', 'image', 'images', 'documents', 'verificationStatus', 'bookingLockToken', 'bookingLockUntil', 'createdAt', 'updatedAt', '__v'].includes(key));
        allowed.forEach((key) => { if (carData[key] !== undefined) car[key] = carData[key]; });
        // Owner approval is mandatory for every listing. Keep these fields
        // normalized for older records and for clients that still send them.
        car.instantBooking = false;
        car.approvalRequired = true;
        const imageFiles = req.files?.images || [];
        if (imageFiles.length) {
            const uploadedImages = await Promise.all(imageFiles.map(async (file) => {
                const response = await imagekit.upload({ file: fs.readFileSync(file.path), fileName: file.originalname, folder: '/cars' });
                return imagekit.url({ path: response.filePath, transformation: [{ width: '1280' }, { quality: 'auto' }, { format: 'webp' }] });
            }));
            car.image = uploadedImages[0];
            car.images = uploadedImages;
        }
        const documentFiles = req.files?.documents || [];
        if (documentFiles.length) {
            const urls = await uploadFiles(documentFiles, '/car-documents');
            car.documents = urls.map((url, index) => ({ documentType: req.body.documentTypes?.split(',')[index] || 'Supporting document', url }));
            car.verificationStatus = 'pending';
        }
        await car.save();
        res.json({ success: true, message: "Vehicle updated", car });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(!car || !car.owner || car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.isAvaliable = !car.isAvaliable;
        await car.save()

        res.json({success: true, message: "Availability Toggled"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Api to delete a car
export const deleteCar = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(!car || !car.owner || car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.owner = null;
        car.isAvaliable = false;

        await car.save()

        res.json({success: true, message: "Vehicle removed"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Dashboard Data
export const getDashboardData = async (req, res) =>{
    try {
        const { _id, role } = req.user;

        if(role !== 'user'){
            return res.json({ success: false, message: "Unauthorized" });
        }

        const cars = await Car.find({owner: _id})
        const bookings = await Booking.find({ owner: _id }).populate('car').sort({ createdAt: -1 });

        const pendingBookings = await Booking.countDocuments({ owner: _id, status: { $in: ["pending", "pending_payment"] } });
        const confirmedBookings = await Booking.countDocuments({ owner: _id, status: { $in: ["confirmed", "active"] } });
        const completedBookings = await Booking.countDocuments({ owner: _id, status: "completed" });

        // Revenue is based on confirmed, active, and completed paid bookings.
        const monthlyRevenue = bookings.filter(booking => ['confirmed', 'active', 'completed'].includes(booking.status)).reduce((acc, booking)=> acc + Number(booking.rentalAmount || booking.price || 0), 0)

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: confirmedBookings,
            completedTrips: completedBookings,
            recentBookings: bookings.slice(0,3),
            monthlyRevenue
        }

        res.json({ success: true, dashboardData });

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update user image

export const updateUserImage = async (req, res)=>{
    try {
        const { _id } = req.user;

        const imageFile = req.file;
        if (!imageFile) return res.status(400).json({ success: false, message: "Choose a profile image first" });

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/users'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [
                {width: '400'}, // Width resizing
                {quality: 'auto'}, // Auto compression
                { format: 'webp' }  // Convert to modern format
            ]
        });

        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, {image});
        res.json({success: true, message: "Image Updated" })

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}   
