const router = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Event = require("../models/event");

// Models to try in order — if one fails (quota/not found), next is tried
const MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
];

router.post("/", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "Gemini API key not configured on server" });
    }

    // Fetch live events from DB
    const events = await Event.find({ status: "PUBLISHED" }).lean();

    const eventContext = events.length
      ? events
          .map((ev, i) => {
            const start = ev.startAt
              ? new Date(ev.startAt).toLocaleString()
              : "TBD";
            const end = ev.endAt ? new Date(ev.endAt).toLocaleString() : "TBD";
            const tickets = (ev.ticketTypes || []).length
              ? ev.ticketTypes
                  .map((t) => `${t.name} (Rs.${t.price}, quota: ${t.quota})`)
                  .join(", ")
              : "General (Free)";
            return `Event ${i + 1}:
  Title: ${ev.title}
  Description: ${ev.description || "N/A"}
  Venue: ${ev.venue}
  Department/Club: ${ev.departmentOrClub}
  Start: ${start}
  End: ${end}
  Capacity: ${ev.capacity}
  Ticket Types: ${tickets}
  Status: ${ev.status}
  Featured: ${ev.isBiggestFest ? "Yes" : "No"}`;
          })
          .join("\n\n")
      : "No events are currently published on CampusConnect.";

    const systemPrompt = `You are CampusConnect Assistant, a friendly AI helper for a college event management platform.

LIVE EVENTS ON CAMPUSCONNECT:
${eventContext}

PLATFORM INFO:
- Students can browse events, register, get QR tickets, and check in at the venue.
- Admins can create/edit/delete events and scan QR codes for check-in.
- After an event ends, registered students can submit feedback with a 1-5 star rating.
- Dashboard shows all your registrations and tickets.
- Profile page: update branch, year, roll number, and college UID.

HOW TO REGISTER:
1. Go to the event page and click Register Now.
2. Select a ticket type if available.
3. Confirm - you will be redirected to your Dashboard.
4. Click View Ticket to get your QR code.
5. Show the QR code at the venue for check-in.

GUIDELINES:
- Answer only questions about campus events, registrations, tickets, platform usage, and schedules.
- Use the live event data above to give accurate answers.
- Keep responses concise (2-4 lines) unless listing event details.
- Be warm, student-friendly, and encouraging.
- If the answer is not in context, say: I do not have that info right now. Please contact your college admin.
- Never make up event details, prices, or dates.

User question: ${String(message).trim()}`;

    // Try each model until one works
    const genAI = new GoogleGenerativeAI(apiKey);
    let reply = null;
    let lastError = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(systemPrompt);
        reply = result.response.text();
        console.log("Chatbot used model: " + modelName);
        break;
      } catch (e) {
        console.warn(
          "Model " + modelName + " failed: " + e.message.slice(0, 80),
        );
        lastError = e;
      }
    }

    if (!reply) throw lastError;

    res.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ message: "Chatbot failed", error: err.message });
  }
});

module.exports = router;
