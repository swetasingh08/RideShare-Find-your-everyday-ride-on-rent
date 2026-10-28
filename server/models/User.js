import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // Identity comes from Clerk. Sparse so pre-Clerk rows survive the cutover.
    clerkId: {type: String, unique: true, sparse: true, index: true},
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true },
    phone: {type: String, default: ''},
    city: {type: String, default: '', maxlength: 80},
    occupation: {type: String, default: '', maxlength: 80},
    age: {type: Number, min: 18, max: 100, default: null},
    profileCompleted: {type: Boolean, default: false},
    location: {type: String, default: '', maxlength: 80},
    role: {type: String, enum: ["admin", "user"], default: 'user' },
    image: {type: String, default: ''},
    totalTrips: {type: Number, default: 0},
    averageRating: {type: Number, default: 0},
    responseRate: {type: Number, default: 0},
    responseTime: {type: String, default: ''},
},{timestamps: true})

const User = mongoose.model('User', userSchema)

export default User
