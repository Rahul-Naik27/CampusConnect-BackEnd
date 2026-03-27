/**
 * CampusConnect — Database Seed Script
 * Run: node seed.js  (from the backend folder)
 * This creates: 1 admin, 2 users, and 4 sample events
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

// ── Models ──
const User = require("./models/User");
const Event = require("./models/event");
const Registration = require("./models/registration");
const Ticket = require("./models/ticket");
const Feedback = require("./models/feedback");
const ScanLog = require("./models/scanLog");

const URI = process.env.URI || "mongodb://localhost:27017/collegeEventDB";

async function seed() {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // ── Wipe existing data ──
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
      Ticket.deleteMany({}),
      Feedback.deleteMany({}),
      ScanLog.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // ── Create Users ──
    const passwordHash = await bcrypt.hash("password123", 10);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@campusconnect.com",
      passwordHash,
      role: "admin",
      phone: "+91 9000000001",
      avatar: "/boy.png",
      gender: "male",
      isVerified: true,
    });

    const student1 = await User.create({
      name: "Rahul Sharma",
      email: "rahul@campusconnect.com",
      passwordHash,
      role: "user",
      phone: "+91 9000000002",
      avatar: "/boy.png",
      gender: "male",
      rollNumber: "2024001",
      collegeUID: "UID2024001",
      class: "B.Tech CSE",
      branch: "CSE",
      yearOfStudy: "3rd",
      isVerified: true,
    });

    const student2 = await User.create({
      name: "Priya Patel",
      email: "priya@campusconnect.com",
      passwordHash,
      role: "user",
      phone: "+91 9000000003",
      avatar: "/girl.png",
      gender: "female",
      rollNumber: "2024002",
      collegeUID: "UID2024002",
      class: "B.Tech ECE",
      branch: "ECE",
      yearOfStudy: "2nd",
      isVerified: true,
    });

    console.log("👤 Created users: admin, rahul, priya");

    // ── Create Events ──
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const event1 = await Event.create({
      title: "TechFest 2026",
      description:
        "The biggest annual technical festival at our college! Featuring hackathons, robotics, coding contests, paper presentations, and cultural night. Don't miss the most exciting event of the year!",
      posterUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      departmentOrClub: "CSE Department",
      venue: "Main Auditorium, Block A",
      startAt: new Date(now.getTime() + 7 * day),
      endAt: new Date(now.getTime() + 9 * day),
      capacity: 500,
      isBiggestFest: true,
      status: "PUBLISHED",
      createdBy: admin._id,
      ticketTypes: [
        { name: "General", price: 0, quota: 300 },
        { name: "VIP", price: 199, quota: 100 },
        { name: "Premium", price: 499, quota: 100 },
      ],
    });

    const event2 = await Event.create({
      title: "Code-a-Thon 2026",
      description:
        "A 24-hour hackathon challenge where teams compete to build innovative solutions. Theme: AI for Social Good. Cash prizes worth ₹50,000!",
      posterUrl:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      departmentOrClub: "Coding Club",
      venue: "Computer Lab, Block C",
      startAt: new Date(now.getTime() + 3 * day),
      endAt: new Date(now.getTime() + 4 * day),
      capacity: 100,
      isBiggestFest: false,
      status: "PUBLISHED",
      createdBy: admin._id,
      ticketTypes: [{ name: "Team Entry", price: 150, quota: 100 }],
    });

    const event3 = await Event.create({
      title: "Cultural Night 2026",
      description:
        "An evening of music, dance, drama and art. Performances by students from all departments. Come celebrate the diversity of our campus culture!",
      posterUrl:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
      departmentOrClub: "Cultural Committee",
      venue: "Open Air Theatre",
      startAt: new Date(now.getTime() + 14 * day),
      endAt: new Date(now.getTime() + 14 * day + 4 * 60 * 60 * 1000),
      capacity: 800,
      isBiggestFest: false,
      status: "PUBLISHED",
      createdBy: admin._id,
      ticketTypes: [
        { name: "General", price: 0, quota: 600 },
        { name: "Premium", price: 99, quota: 200 },
      ],
    });

    const event4 = await Event.create({
      title: "RoboWars Championship",
      description:
        "Watch combat robots battle it out in thrilling elimination rounds! Weight categories: 15kg and 30kg. Register your robot or come watch the action live.",
      posterUrl:
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
      departmentOrClub: "Robotics Club",
      venue: "Sports Ground, Block D",
      startAt: new Date(now.getTime() + 5 * day),
      endAt: new Date(now.getTime() + 5 * day + 6 * 60 * 60 * 1000),
      capacity: 200,
      isBiggestFest: false,
      status: "PUBLISHED",
      createdBy: admin._id,
      ticketTypes: [
        { name: "Spectator", price: 0, quota: 150 },
        { name: "Participant", price: 250, quota: 50 },
      ],
    });

    console.log(
      "🎉 Created 4 events: TechFest, Code-a-Thon, Cultural Night, RoboWars",
    );

    // ── Create a sample Registration + Ticket for student1 ──
    const reg = await Registration.create({
      userId: student1._id,
      eventId: event1._id,
      ticketTypeName: "General",
      status: "CONFIRMED",
    });

    await Ticket.create({
      registrationId: reg._id,
      userId: student1._id,
      eventId: event1._id,
      ticketId: `TKT-${String(event1._id).slice(-4)}${String(student1._id).slice(-4)}-DEMO1`,
    });

    console.log("🎫 Created sample registration & ticket for Rahul");

    // ── Summary ──
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ DATABASE SEEDED SUCCESSFULLY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔐 LOGIN CREDENTIALS (password: password123)");
    console.log("┌─────────────────────────────────────────┐");
    console.log("│ ADMIN                                   │");
    console.log("│   Email : admin@campusconnect.com       │");
    console.log("│   Pass  : password123                   │");
    console.log("├─────────────────────────────────────────┤");
    console.log("│ STUDENT 1                               │");
    console.log("│   Email : rahul@campusconnect.com       │");
    console.log("│   Pass  : password123                   │");
    console.log("├─────────────────────────────────────────┤");
    console.log("│ STUDENT 2                               │");
    console.log("│   Email : priya@campusconnect.com       │");
    console.log("│   Pass  : password123                   │");
    console.log("└─────────────────────────────────────────┘");
    console.log("\n🎉 Events created:");
    console.log("   1. TechFest 2026        (Featured, starts in 7 days)");
    console.log("   2. Code-a-Thon 2026     (starts in 3 days)");
    console.log("   3. Cultural Night 2026  (starts in 14 days)");
    console.log("   4. RoboWars Championship(starts in 5 days)");
    console.log("\n🌐 Open: http://localhost:5173");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  }
}

seed();
