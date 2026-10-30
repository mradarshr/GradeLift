const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notes." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { title, content, date } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Title is required." });
        }
        const note = new Note({
            userId: req.userId,
            title: title.trim(),
            content: content || "",
            date: date || new Date().toISOString().split("T")[0]
        });
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(500).json({ error: "Failed to create note." });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { title, content, date } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title.trim();
        if (content !== undefined) updates.content = content;
        if (date !== undefined) updates.date = date;

        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true }
        );
        if (!note) {
            return res.status(404).json({ error: "Note not found." });
        }
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: "Failed to update note." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!note) {
            return res.status(404).json({ error: "Note not found." });
        }
        res.json({ message: "Note deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete note." });
    }
});

module.exports = router;
