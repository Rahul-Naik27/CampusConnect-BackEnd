const app = require("../app");

module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({
      message: "Server crashed",
      error: err.message,
    });
  }
};
