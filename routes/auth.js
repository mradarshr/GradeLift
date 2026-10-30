const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Task = require("../models/Task");
const Timetable = require("../models/Timetable");
const Note = require("../models/Note");
const Exam = require("../models/Exam");
const Progress = require("../models/Progress");
const auth = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "gradelift_production_jwt_secret_key_2026";

async function seedUserData(userId) {
    await Task.insertMany([
        { userId, name: "Complete Math Assignment", due: "2026-11-01", done: false },
        { userId, name: "Read Physics Chapter 5", due: "2026-10-28", done: false },
        { userId, name: "Submit Lab Report", due: "2026-10-30", done: true },
        { userId, name: "Prepare Presentation Slides", due: "2026-11-05", done: false },
        { userId, name: "Review Chemistry Notes", due: "2026-10-25", done: true }
    ]);

    await Timetable.insertMany([
        { userId, day: "Monday", time: "09:00", subject: "Mathematics" },
        { userId, day: "Monday", time: "11:00", subject: "Physics" },
        { userId, day: "Tuesday", time: "10:00", subject: "Chemistry" },
        { userId, day: "Wednesday", time: "09:00", subject: "English" },
        { userId, day: "Thursday", time: "14:00", subject: "Computer Science" },
        { userId, day: "Friday", time: "09:00", subject: "Mathematics" },
        { userId, day: "Friday", time: "11:00", subject: "Physics" }
    ]);

    await Note.insertMany([
        { userId, title: "Physics Formulas", content: "F = ma\nE = mc squared\nV = IR\nP = IV\nW = Fd", date: "2026-10-20" },
        { userId, title: "Essay Outline", content: "Introduction - Hook and thesis statement\nBody Paragraph 1 - Main argument\nBody Paragraph 2 - Supporting evidence\nBody Paragraph 3 - Counter argument\nConclusion - Restate thesis", date: "2026-10-22" },
        { userId, title: "CS Algorithm Notes", content: "Binary Search - O(log n)\nMerge Sort - O(n log n)\nQuick Sort - O(n log n) average\nBubble Sort - O(n squared)", date: "2026-10-24" }
    ]);

    await Exam.insertMany([
        { userId, name: "Mathematics Mid-Term", date: "2026-11-15" },
        { userId, name: "Physics Final", date: "2026-12-10" },
        { userId, name: "Chemistry Quiz", date: "2026-11-05" }
    ]);

    await Progress.create({
        userId,
        tasksPerDay: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            data: [3, 5, 2, 4, 6, 1, 3]
        },
        hoursBySubject: {
            labels: ["Math", "Physics", "Chemistry", "English", "CS"],
            data: [8, 6, 4, 3, 7]
        },
        sessionsCompleted: 0
    });
}

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password
        });
        await user.save();

        await seedUserData(user._id);

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax"
        });

        res.status(201).json({
            message: "Account created successfully.",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during registration." });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "lax"
        });

        res.json({
            message: "Login successful.",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully." });
});

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user data." });
    }
});

module.exports = router;
