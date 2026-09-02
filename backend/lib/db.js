import mongoose from "mongoose";
import { logger } from "./logger.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        logger.info("MongoDB connected", { host: conn.connection.host });
        return conn;
    } catch (error) {
        logger.error("MongoDB connection failed", { error: error.message });
        process.exit(1);
    }
};
