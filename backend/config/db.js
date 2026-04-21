import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not defined");
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        throw error;
    }
};

export default connectDB;
