const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // Retry logic (important for Render cold starts)
    console.log("🔄 Retrying MongoDB connection in 5 seconds...");

    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
