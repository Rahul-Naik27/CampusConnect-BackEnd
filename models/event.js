const mongoose = require("mongoose");

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },     // e.g., General
    price: { type: Number, default: 0 },        // INR
    quota: { type: Number, default: 0 }         // optional per-type quota
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    departmentOrClub: { type: String, required: true }, // e.g., CSE Dept, Robotics Club
    venue: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    capacity: { type: Number, required: true },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
    isBiggestFest: { type: Boolean, default: false },
    status: { type: String, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], default: "PUBLISHED" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, startAt: 1 });
eventSchema.index({ departmentOrClub: 1 });
eventSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Event", eventSchema);
