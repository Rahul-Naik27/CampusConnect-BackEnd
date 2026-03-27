const router = require("express").Router();
const Event = require("../models/event");

// GET /api/v1/events  -> list published events (landing/dashboard)
router.get("/", async (_req, res) => {
  try {
    const events = await Event.find({ status: "PUBLISHED" }).sort({ startAt: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err.message });
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

// GET /api/v1/events/featured/one  -> biggest fest for hero timer
router.get("/featured/one", async (_req, res) => {
  try {
    const fest = await Event.findOne({ isBiggestFest: true, status: "PUBLISHED" }).sort({ startAt: 1 });
    res.json(fest);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch featured event", error: err.message });
  }
});

module.exports = router;
