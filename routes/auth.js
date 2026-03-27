const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/sign-up", async (req, res) => {
  try {
    const { name, email, password, role, ...profile } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const user = new User({
      name: name.trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash: password,
      role: role === "admin" ? "admin" : "user",
      ...profile,
    });

    await user.save();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing in environment");
    }
    const secret = process.env.JWT_SECRET;

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      secret,
      { expiresIn: "3d" },
    );

    res.status(201).json({
      message: "Sign up successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Sign up failed", error: err.message });
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const existingUser = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (!existingUser)
      return res.status(400).json({ message: "Invalid credentials" });

    const matched = await existingUser.verifyPassword(password);
    if (!matched)
      return res.status(400).json({ message: "Invalid credentials" });

    const secret = process.env.JWT_SECRET || "campusconnect_secret";
    const token = jwt.sign(
      {
        id: existingUser._id.toString(),
        role: existingUser.role,
        name: existingUser.name,
        email: existingUser.email,
      },
      secret,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
