const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.userId });
        if (!progress) {
            progress = await Progress.create({
                userId: req.userId,
                tasksPerDay: {
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    data: [0, 0, 0, 0, 0, 0, 0]
                },
                hoursBySubject: {
                    labels: ["Math", "Physics", "Chemistry", "English", "CS"],
                    data: [0, 0, 0, 0, 0]
                },
                sessionsCompleted: 0
            });
        }
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch progress." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { chartType, label, value } = req.body;
        if (!chartType || !label || value === undefined) {
            return res.status(400).json({ error: "Chart type, label, and value are required." });
        }

        let progress = await Progress.findOne({ userId: req.userId });
        if (!progress) {
            progress = new Progress({ userId: req.userId });
        }

        const numVal = Number(value);

        if (chartType === "Tasks Per Day") {
            const index = progress.tasksPerDay.labels.indexOf(label);
            if (index > -1) {
                progress.tasksPerDay.data[index] += numVal;
            } else {
                progress.tasksPerDay.labels.push(label);
                progress.tasksPerDay.data.push(numVal);
            }
        } else {
            const index = progress.hoursBySubject.labels.indexOf(label);
            if (index > -1) {
                progress.hoursBySubject.data[index] += numVal;
            } else {
                progress.hoursBySubject.labels.push(label);
                progress.hoursBySubject.data.push(numVal);
            }
        }

        progress.updatedAt = Date.now();
        await progress.save();
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: "Failed to update progress." });
    }
});

router.post("/session", async (req, res) => {
    try {
        let progress = await Progress.findOne({ userId: req.userId });
        if (!progress) {
            progress = new Progress({ userId: req.userId });
        }
        progress.sessionsCompleted = (progress.sessionsCompleted || 0) + 1;
        progress.updatedAt = Date.now();
        await progress.save();
        res.json({ sessionsCompleted: progress.sessionsCompleted });
    } catch (err) {
        res.status(500).json({ error: "Failed to record session." });
    }
});

module.exports = router;
