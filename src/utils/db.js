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

    // Cleanup: Drop legacy email unique index to facilitate multi-role identity cluster
    try {
      const UserCollection = mongoose.connection.collection('users');
      const indexes = await UserCollection.getIndexes();
      if (indexes.email_1) {
        await UserCollection.dropIndex('email_1');
        console.info("Identity Cluster Migration: Successfully dropped legacy unique email index.");
      }
    } catch (e) {
      // Index might not exist or error during startup, we log but continue
      console.warn("Identity Cluster Migration Warning:", e.message);
    }
  } catch (error) {
    console.error("🔴 MongoDB Connection Error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
