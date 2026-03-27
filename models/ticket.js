const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Registration", unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    ticketId: { type: String, required: true, unique: true }, // used in QR
    checkedInAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
