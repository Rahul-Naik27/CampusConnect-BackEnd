const connectDB = require("../conn/conn");
const app = require("../app");

// Ensure DB is connected before handling any request (critical for Vercel serverless cold starts)
module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      message: "Server crashed",
      error: err.message,
    });
  }
};
