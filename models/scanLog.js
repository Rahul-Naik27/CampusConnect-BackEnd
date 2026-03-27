const mongoose = require("mongoose");

const scanLogSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false, index: true },
    scannedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    result: { type: String, enum: ["SUCCESS", "REJECTED"], required: true },
    reason: { type: String, default: "" }
  },
  { timestamps: { createdAt: "scannedAt", updatedAt: false } }
);

module.exports = mongoose.model("ScanLog", scanLogSchema);
