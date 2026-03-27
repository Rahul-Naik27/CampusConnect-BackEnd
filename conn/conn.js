const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.URI;
  if (!uri) {
    console.error("❌ MongoDB URI not found in process.env.URI");
    throw new Error("Missing MongoDB URI");
  }
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
