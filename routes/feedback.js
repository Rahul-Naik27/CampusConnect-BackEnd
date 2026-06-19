const router = require("express").Router();
const { authenticateToken, requireAdmin } = require("../middleware/userAuth");
const Event = require("../models/event");
const Feedback = require("../models/feedback");
const Registration = require("../models/registration");

// POST / — submit feedback
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body || {};
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: "Event not found" });

    if (new Date() < new Date(ev.endAt)) {
      return res.status(400).json({ message: "Feedback opens after event ends" });
    }

    const reg = await Registration.findOne({ userId: req.user.id, eventId });
    if (!reg) return res.status(400).json({ message: "Not registered for this event" });

    const fb = await Feedback.create({ userId: req.user.id, eventId, rating, comment });
    res.json({ message: "Feedback submitted", feedback: fb });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Feedback already submitted" });
    res.status(500).json({ message: "Feedback failed", error: err.message });
  }
});

// GET /:eventId — get all feedback for an event (admin)
router.get("/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ eventId: req.params.eventId })
      .populate("userId", "name email rollNumber branch avatar")
      .sort({ createdAt: -1 });
    const avg = feedbacks.length
      ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length
      : null;
    res.json({ feedbacks, count: feedbacks.length, avgRating: avg ? Math.round(avg * 10) / 10 : null });
  } catch (err) {
    res.status(500).json({ message: "Fetch feedback failed", error: err.message });
  }
});

module.exports = router;
