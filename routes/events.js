const router = require("express").Router();
const Event = require("../models/event");
const Registration = require("../models/registration");

// GET /api/v1/events  -> list published events (landing/dashboard)
router.get("/", async (_req, res) => {
  try {
    const events = await Event.find({ status: "PUBLISHED" }).sort({ startAt: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err.message });
  }
});

// ⚠️ Specific routes MUST come before /:id to avoid being matched as a param

// GET /api/v1/events/featured/one  -> biggest fest for hero timer
router.get("/featured/one", async (_req, res) => {
  try {
    const fest = await Event.findOne({ isBiggestFest: true, status: "PUBLISHED" }).sort({ startAt: 1 });
    res.json(fest);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch featured event", error: err.message });
  }
});

// GET /api/v1/events/:id  -> event details
router.get("/:id", async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev || ev.status === "ARCHIVED") return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch event", error: err.message });
  }
});

// GET /api/v1/events/:id/registration-count  -> returns count + isSoldOut
router.get("/:id/registration-count", async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).select("capacity");
    if (!ev) return res.status(404).json({ message: "Event not found" });
    const count = await Registration.countDocuments({ eventId: req.params.id, status: "CONFIRMED" });
    res.json({ count, capacity: ev.capacity, isSoldOut: count >= ev.capacity });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch count", error: err.message });
  }
});

module.exports = router;
