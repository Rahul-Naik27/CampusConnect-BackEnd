const router = require("express").Router();
const mongoose = require("mongoose");
const { authenticateToken, requireAdmin } = require("../middleware/userAuth");
const Event = require("../models/event");
const Registration = require("../models/registration");
const Ticket = require("../models/ticket");

router.post("/events", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const ev = await Event.create({ ...body, createdBy: req.user.id });
    res.status(201).json(ev);
  } catch (err) {
    res.status(500).json({ message: "Create event failed", error: err.message });
  }
});

router.put("/events/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user.id }, { new: true, runValidators: true });
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    res.status(500).json({ message: "Update event failed", error: err.message });
  }
});

router.delete("/events/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndDelete(req.params.id);
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete event failed", error: err.message });
  }
});

router.get("/events/:id/attendees", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const regs = await Registration.find({ eventId: req.params.id, status: "CONFIRMED" }).populate("userId", "name email").sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: "Fetch attendees failed", error: err.message });
  }
});

router.get("/reports/attendance/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const registrations = await Registration.countDocuments({ eventId, status: "CONFIRMED" });
    const checkIns = await Ticket.countDocuments({ eventId, checkedInAt: { $ne: null } });
    const showUpRate = registrations > 0 ? checkIns / registrations : 0;
    res.json({ eventId, registrations, checkIns, showUpRate });
  } catch (err) {
    res.status(500).json({ message: "Attendance report failed", error: err.message });
  }
});

router.get("/reports/ticket-revenue/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    const agg = await Registration.aggregate([
      { $match: { eventId: eventObjectId, status: "CONFIRMED" } },
      { $group: { _id: "$ticketTypeName", sold: { $sum: 1 } } }
    ]);

    const ev = await Event.findById(eventId).lean();
    const priceMap = new Map((ev?.ticketTypes || []).map(t => [t.name, t.price || 0]));

    const byType = agg.map(r => {
      const price = priceMap.get(r._id) ?? 0;
      return { type: r._id, price, sold: r.sold, revenue: price * r.sold };
    });

    const totals = byType.reduce((acc, r) => ({ sold: acc.sold + r.sold, revenue: acc.revenue + r.revenue }), { sold: 0, revenue: 0 });

    res.json({ eventId, byType, totals });
  } catch (err) {
    res.status(500).json({ message: "Ticket/Revenue report failed", error: err.message });
  }
});

module.exports = router;
