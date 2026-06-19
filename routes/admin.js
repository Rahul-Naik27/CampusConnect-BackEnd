const router = require("express").Router();
const mongoose = require("mongoose");
const { authenticateToken, requireAdmin } = require("../middleware/userAuth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Event = require("../models/event");
const Registration = require("../models/registration");
const Ticket = require("../models/ticket");
const Feedback = require("../models/feedback");
const User = require("../models/User");

const AI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];
async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastErr;
  for (const name of AI_MODELS) {
    try {
      const result = await genAI
        .getGenerativeModel({ model: name })
        .generateContent(prompt);
      return result.response.text();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// GET /admin/events/all — returns ALL events (DRAFT, PUBLISHED, ARCHIVED)
router.get("/events/all", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Fetch all events failed", error: err.message });
  }
});

router.post("/events", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const ev = await Event.create({ ...body, createdBy: req.user.id });
    res.status(201).json(ev);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Create event failed", error: err.message });
  }
});

router.put("/events/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true },
    );
    if (!ev) return res.status(404).json({ message: "Event not found" });
    res.json(ev);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Update event failed", error: err.message });
  }
});

router.delete(
  "/events/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const ev = await Event.findByIdAndDelete(req.params.id);
      if (!ev) return res.status(404).json({ message: "Event not found" });
      res.json({ message: "Event deleted" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Delete event failed", error: err.message });
    }
  },
);

router.get(
  "/events/:id/attendees",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const regs = await Registration.find({
        eventId: req.params.id,
        status: "CONFIRMED",
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
      res.json(regs);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Fetch attendees failed", error: err.message });
    }
  },
);

router.get(
  "/reports/attendance/:eventId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const registrations = await Registration.countDocuments({
        eventId,
        status: "CONFIRMED",
      });
      const checkIns = await Ticket.countDocuments({
        eventId,
        checkedInAt: { $ne: null },
      });
      const showUpRate = registrations > 0 ? checkIns / registrations : 0;
      res.json({ eventId, registrations, checkIns, showUpRate });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Attendance report failed", error: err.message });
    }
  },
);

router.get(
  "/reports/ticket-revenue/:eventId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const eventObjectId = new mongoose.Types.ObjectId(eventId);

      const agg = await Registration.aggregate([
        { $match: { eventId: eventObjectId, status: "CONFIRMED" } },
        { $group: { _id: "$ticketTypeName", sold: { $sum: 1 } } },
      ]);

      const ev = await Event.findById(eventId).lean();
      const priceMap = new Map(
        (ev?.ticketTypes || []).map((t) => [t.name, t.price || 0]),
      );

      const byType = agg.map((r) => {
        const price = priceMap.get(r._id) ?? 0;
        return { type: r._id, price, sold: r.sold, revenue: price * r.sold };
      });

      const totals = byType.reduce(
        (acc, r) => ({
          sold: acc.sold + r.sold,
          revenue: acc.revenue + r.revenue,
        }),
        { sold: 0, revenue: 0 },
      );

      res.json({ eventId, byType, totals });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Ticket/Revenue report failed", error: err.message });
    }
  },
);

// ── Admin Stats Dashboard ──
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalEvents,
      totalUsers,
      regAgg,
      checkInCount,
      feedbackAgg,
      topEvents,
    ] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments(),
      Registration.aggregate([
        { $match: { status: "CONFIRMED" } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "ev",
          },
        },
        { $unwind: { path: "$ev", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            revenue: {
              $sum: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        tt: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: { $ifNull: ["$ev.ticketTypes", []] },
                                as: "t",
                                cond: { $eq: ["$$t.name", "$ticketTypeName"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: "$$tt.price",
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Ticket.countDocuments({ checkedInAt: { $ne: null } }),
      Feedback.aggregate([
        { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),
      Registration.aggregate([
        { $match: { status: "CONFIRMED" } },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "_id",
            as: "ev",
          },
        },
        { $unwind: "$ev" },
        {
          $project: {
            _id: 1,
            count: 1,
            title: "$ev.title",
            capacity: "$ev.capacity",
          },
        },
      ]),
    ]);

    res.json({
      totalEvents,
      totalUsers,
      totalRegistrations: regAgg[0]?.total || 0,
      totalRevenue: regAgg[0]?.revenue || 0,
      totalCheckIns: checkInCount,
      avgRating: feedbackAgg[0]
        ? Math.round(feedbackAgg[0].avg * 10) / 10
        : null,
      totalFeedbacks: feedbackAgg[0]?.total || 0,
      topEvents,
    });
  } catch (err) {
    res.status(500).json({ message: "Stats failed", error: err.message });
  }
});

// ── AI Event Description Generator ──
router.post(
  "/ai/generate-description",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, department, venue, date, type } = req.body || {};
      if (!title)
        return res.status(400).json({ message: "Event title is required" });

      const prompt = `You are writing an event description for a college event management platform called CampusConnect.

Generate a compelling, engaging event description (exactly 3-4 sentences) for the following event:
- Title: ${title}
- Department/Club: ${department || "College"}
- Venue: ${venue || "Campus"}
- Date: ${date || "Upcoming"}
- Type: ${type || "General Event"}

Guidelines:
- Be enthusiastic and student-friendly
- Mention the department/club name
- Keep it concise but exciting
- Do NOT use bullet points, just flowing sentences
- Do NOT include any event dates/times (admin will add those)
- Output ONLY the description text, nothing else`;

      const description = await callGemini(prompt);
      res.json({ description: description.trim() });
    } catch (err) {
      res
        .status(500)
        .json({ message: "AI generation failed", error: err.message });
    }
  },
);

// GET /admin/stats/charts — data for 3 frontend charts
router.get("/stats/charts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [timeline, ticketBreakdown] = await Promise.all([
      // Daily registrations for last 7 days
      Registration.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: "CONFIRMED" } },
        { $group: { _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]),
      // Ticket type breakdown
      Registration.aggregate([
        { $match: { status: "CONFIRMED" } },
        { $group: { _id: "$ticketTypeName", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } },
      ]),
    ]);

    res.json({ timeline, ticketBreakdown });
  } catch (err) {
    res.status(500).json({ message: "Charts data failed", error: err.message });
  }
});

module.exports = router;
