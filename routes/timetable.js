const express = require("express");
const router = express.Router();
const Timetable = require("../models/Timetable");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        const slots = await Timetable.find({ userId: req.userId });
        res.json(slots);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch timetable." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { day, time, subject } = req.body;
        if (!day || !time || !subject) {
            return res.status(400).json({ error: "Day, time, and subject are required." });
        }
        const slot = new Timetable({
            userId: req.userId,
            day,
            time,
            subject: subject.trim()
        });
        await slot.save();
        res.status(201).json(slot);
    } catch (err) {
        res.status(500).json({ error: "Failed to add timetable slot." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const slot = await Timetable.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!slot) {
            return res.status(404).json({ error: "Slot not found." });
        }
        res.json({ message: "Timetable slot deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete slot." });
    }
});

module.exports = router;
