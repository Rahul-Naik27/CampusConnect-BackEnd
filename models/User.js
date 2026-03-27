const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "student"], default: "user" },

    phone: { type: String, default: null },
    avatar: { type: String, default: "/boy.png" },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    rollNumber: { type: String, unique: true, sparse: true },
    collegeUID: { type: String, unique: true, sparse: true },
    class: { type: String, default: null },
    branch: { type: String, enum: ["CSE", "ECE", "ME", "CE", "EE", "IT", null], default: null },
    yearOfStudy: { type: String, enum: ["1st", "2nd", "3rd", "4th"], default: "1st" },
    department: { type: String, default: null },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
