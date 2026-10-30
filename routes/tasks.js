const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, due } = req.body;
        if (!name || !due) {
            return res.status(400).json({ error: "Task name and due date are required." });
        }
        const task = new Task({
            userId: req.userId,
            name: name.trim(),
            due,
            done: false
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: "Failed to create task." });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { name, due, done } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (due !== undefined) updates.due = due;
        if (done !== undefined) updates.done = done;

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true }
        );
        if (!task) {
            return res.status(404).json({ error: "Task not found." });
        }
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: "Failed to update task." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) {
            return res.status(404).json({ error: "Task not found." });
        }
        res.json({ message: "Task deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete task." });
    }
});

module.exports = router;
