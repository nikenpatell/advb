const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

/**
 * Singleton Database Connection Strategy.
 * Optimized for both long-running Node.js processes and Serverless environments like Vercel.
 */
const connectDB = async () => {
  if (isConnected) {
    console.info("Using existing database connection.");
    return;
  }

  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("CRITICAL: MONGO_URI is not defined in environment variables.");
    throw new Error("MONGO_URI missing");
  }

  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = db.connections[0].readyState;
    console.info("🟢 Database connection established successfully.");
  } catch (error) {
    console.error("🔴 MongoDB Connection Error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
