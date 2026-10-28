import mongoose from "mongoose";
import { ensureDnsServers } from "./dns.js";

const DB_NAME = "car-rental";

// Builds the connection string once so every entry point targets the same
// database, whether or not MONGODB_URI already carries a database name.
export const databaseUri = () => {
    const uri = (process.env.MONGODB_URI || "").trim();
    if (!uri) throw new Error("MONGODB_URI is not set in server/.env");

    // Split off the scheme first: the "//" in mongodb+srv:// would otherwise
    // look like a path segment.
    const [scheme, ...rest] = uri.split("://");
    const remainder = rest.join("://");
    return remainder.includes("/") ? uri : `${scheme}://${remainder}/${DB_NAME}`;
};

const connectDB = async () => {
    ensureDnsServers();

    mongoose.connection.on("connected", () => console.log("Database Connected"));
    mongoose.connection.on("error", (error) => console.error("Database error:", error.message));

    try {
        await mongoose.connect(databaseUri(), {
            serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 10000,
            connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 10000,
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
};

export default connectDB;
