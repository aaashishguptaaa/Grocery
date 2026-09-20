import mongoose from "mongoose";

const mongodbUrl = process.env.MONGODB_URL;

if (!mongodbUrl) {
    throw new Error("MONGODB_URL is not defined in environment variables");
}

interface MongooseCache {
    conn: any;
    promise: Promise<any> | null;
}

declare global {
    var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

const connectDb = async () => {
    // If already connected and ready, return existing connection
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // If connection was lost or closed, reset promise so it can reconnect
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
        cached.promise = null;
        cached.conn = null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(mongodbUrl, opts).then((mongooseInstance) => {
            return mongooseInstance.connection;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        // IMPORTANT: Reset cache so subsequent requests can retry instead of being permanently stuck!
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
};

export default connectDb;