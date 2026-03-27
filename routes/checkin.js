const router = require("express").Router();
const { authenticateToken, requireAdmin } = require("../middleware/userAuth");
const Ticket = require("../models/ticket");
const ScanLog = require("../models/scanLog");

router.post("/scan", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.body || {};
    if (!ticketId) return res.status(400).json({ message: "ticketId is required" });

    const t = await Ticket.findOne({ ticketId });
    if (!t) {
      await ScanLog.create({ ticketId, scannedByAdminId: req.user.id, result: "REJECTED", reason: "Ticket not found" });
      return res.status(404).json({ message: "Invalid ticket" });
    }

    if (!t.checkedInAt) {
      t.checkedInAt = new Date();
      await t.save();
      await ScanLog.create({ ticketId, eventId: t.eventId, scannedByAdminId: req.user.id, result: "SUCCESS" });
      return res.json({ message: "Check-in successful", ticket: t });
    } else {
      await ScanLog.create({ ticketId, eventId: t.eventId, scannedByAdminId: req.user.id, result: "REJECTED", reason: "Already checked in" });
      return res.status(400).json({ message: "Already checked in", ticket: t });
    }
  } catch (err) {
    res.status(500).json({ message: "Check-in failed", error: err.message });
  }
});

module.exports = router;
