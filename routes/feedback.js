const router = require("express").Router();
const { authenticateToken } = require("../middleware/userAuth");
const Event = require("../models/event");
const Feedback = require("../models/feedback");
const Registration = require("../models/registration");

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

module.exports = router;
