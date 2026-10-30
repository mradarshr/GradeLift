const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        const exams = await Exam.find({ userId: req.userId }).sort({ date: 1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch exams." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, date } = req.body;
        if (!name || !date) {
            return res.status(400).json({ error: "Exam name and date are required." });
        }
        const exam = new Exam({
            userId: req.userId,
            name: name.trim(),
            date
        });
        await exam.save();
        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ error: "Failed to add exam." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!exam) {
            return res.status(404).json({ error: "Exam not found." });
        }
        res.json({ message: "Exam deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete exam." });
    }
});

module.exports = router;
