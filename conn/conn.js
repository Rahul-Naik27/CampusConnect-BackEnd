const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.URI;

  if (!uri) {
    console.error("❌ MongoDB URI not found");
    throw new Error("Missing MongoDB URI");
  }

  if (isConnected) return;

  try {
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri);

    isConnected = conn.connections[0].readyState;

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

module.exports = connectDB;
