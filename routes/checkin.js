const router = require("express").Router();
const { authenticateToken, requireAdmin } = require("../middleware/userAuth");
const Ticket = require("../models/ticket");
const ScanLog = require("../models/scanLog");

// POST /api/v1/checkin/scan  { ticketId }
router.post("/scan", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.body || {};
    if (!ticketId) return res.status(400).json({ message: "ticketId is required" });

    const t = await Ticket.findOne({ ticketId })
      .populate("userId", "name email rollNumber branch yearOfStudy avatar")
      .populate("eventId", "title venue startAt");

    if (!t) {
      await ScanLog.create({ ticketId, scannedByAdminId: req.user.id, result: "REJECTED", reason: "Ticket not found" });
      return res.status(404).json({ message: "Invalid ticket — not found in system" });
    }

    if (!t.checkedInAt) {
      t.checkedInAt = new Date();
      await t.save();
      await ScanLog.create({ ticketId, eventId: t.eventId, scannedByAdminId: req.user.id, result: "SUCCESS" });

      return res.json({
        message: "Check-in successful",
        result: "SUCCESS",
        ticket: {
          ticketId: t.ticketId,
          checkedInAt: t.checkedInAt,
        },
        attendee: {
          name: t.userId?.name || "Unknown",
          email: t.userId?.email || "",
          rollNumber: t.userId?.rollNumber || "—",
          branch: t.userId?.branch || "—",
          yearOfStudy: t.userId?.yearOfStudy || "—",
          avatar: t.userId?.avatar || "/boy.png",
        },
        event: {
          title: t.eventId?.title || "—",
          venue: t.eventId?.venue || "—",
          startAt: t.eventId?.startAt,
        }
      });
    } else {
      await ScanLog.create({ ticketId, eventId: t.eventId, scannedByAdminId: req.user.id, result: "REJECTED", reason: "Already checked in" });
      return res.status(400).json({
        message: "Already checked in",
        result: "DUPLICATE",
        ticket: { ticketId: t.ticketId, checkedInAt: t.checkedInAt },
        attendee: {
          name: t.userId?.name || "Unknown",
          email: t.userId?.email || "",
          rollNumber: t.userId?.rollNumber || "—",
        }
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Check-in failed", error: err.message });
  }
});

// GET /api/v1/checkin/count/:eventId  -> today's + total check-in count
router.get("/count/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalCheckIns, todayCheckIns] = await Promise.all([
      Ticket.countDocuments({ eventId, checkedInAt: { $ne: null } }),
      Ticket.countDocuments({ eventId, checkedInAt: { $gte: startOfDay } }),
    ]);

    res.json({ totalCheckIns, todayCheckIns });
  } catch (err) {
    res.status(500).json({ message: "Count failed", error: err.message });
  }
});

module.exports = router;
