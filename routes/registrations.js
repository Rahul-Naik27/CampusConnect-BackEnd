const router = require("express").Router();
const { authenticateToken } = require("../middleware/userAuth");
const Event = require("../models/event");
const Registration = require("../models/registration");

// POST /api/v1/registrations  { eventId, ticketTypeName? }
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { eventId, ticketTypeName } = req.body || {};
    const userId = req.user.id;

    const ev = await Event.findById(eventId);
    if (!ev || ev.status !== "PUBLISHED") return res.status(404).json({ message: "Event not available" });

    const current = await Registration.countDocuments({ eventId, status: "CONFIRMED" });
    if (current >= ev.capacity) return res.status(400).json({ message: "Event is full" });

    const dup = await Registration.findOne({ userId, eventId });
    if (dup) return res.status(400).json({ message: "Already registered" });

    const reg = await Registration.create({
      userId,
      eventId,
      ticketTypeName: ticketTypeName || (ev.ticketTypes?.[0]?.name || "General"),
      status: "CONFIRMED"
    });

    res.status(201).json({ message: "Registered", registration: reg });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// GET /api/v1/registrations/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const regs = await Registration.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate("eventId");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch registrations", error: err.message });
  }
});

module.exports = router;
