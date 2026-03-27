const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { authenticateToken } = require("../middleware/userAuth");
const Registration = require("../models/registration");
const Ticket = require("../models/ticket");
const Event = require("../models/event");

// helper: secure unique ticketId generator
const genTicketId = () => {
  return `TKT-${uuidv4()}`;
};

// POST /api/v1/tickets/issue  { registrationId }
router.post("/issue", authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.body || {};
    const reg = await Registration.findById(registrationId);
    if (!reg || String(reg.userId) !== req.user.id)
      return res.status(404).json({ message: "Registration not found" });

    let t = await Ticket.findOne({ registrationId: reg._id });
    if (!t) {
      t = await Ticket.create({
        registrationId: reg._id,
        userId: reg.userId,
        eventId: reg.eventId,
        ticketId: genTicketId(reg.eventId, reg.userId),
      });
    }

    const ev = await Event.findById(reg.eventId);
    res.json({ ticket: t, event: ev });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Issue ticket failed", error: err.message });
  }
});

// GET /api/v1/tickets/:ticketId
router.get("/:ticketId", authenticateToken, async (req, res) => {
  try {
    const t = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!t) return res.status(404).json({ message: "Ticket not found" });
    if (String(t.userId) !== req.user.id)
      return res.status(403).json({ message: "Not your ticket" });

    const ev = await Event.findById(t.eventId);
    res.json({ ticket: t, event: ev });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch ticket", error: err.message });
  }
});

module.exports = router;
