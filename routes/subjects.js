const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Progress = require("../models/Progress");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/", async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch subjects." });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, code, color, instructor, targetGrade, weeklyGoalHours } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Subject name is required." });
        }

        const subject = new Subject({
            userId: req.userId,
            name: name.trim(),
            code: (code || "").trim(),
            color: color || "#7c3aed",
            instructor: (instructor || "").trim(),
            targetGrade: (targetGrade || "A").trim(),
            weeklyGoalHours: Number(weeklyGoalHours) || 5,
            loggedHours: 0
        });

        await subject.save();

        let progress = await Progress.findOne({ userId: req.userId });
        if (progress) {
            if (!progress.hoursBySubject.labels.includes(subject.name)) {
                progress.hoursBySubject.labels.push(subject.name);
                progress.hoursBySubject.data.push(0);
                await progress.save();
            }
        }

        res.status(201).json(subject);
    } catch (err) {
        res.status(500).json({ error: "Failed to create subject." });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { name, code, color, instructor, targetGrade, weeklyGoalHours, loggedHours } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (code !== undefined) updates.code = code.trim();
        if (color !== undefined) updates.color = color;
        if (instructor !== undefined) updates.instructor = instructor.trim();
        if (targetGrade !== undefined) updates.targetGrade = targetGrade.trim();
        if (weeklyGoalHours !== undefined) updates.weeklyGoalHours = Number(weeklyGoalHours);
        if (loggedHours !== undefined) updates.loggedHours = Number(loggedHours);

        const oldSubject = await Subject.findOne({ _id: req.params.id, userId: req.userId });
        if (!oldSubject) {
            return res.status(404).json({ error: "Subject not found." });
        }

        const oldName = oldSubject.name;
        const updated = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true }
        );

        if (name && name.trim() !== oldName) {
            let progress = await Progress.findOne({ userId: req.userId });
            if (progress) {
                const idx = progress.hoursBySubject.labels.indexOf(oldName);
                if (idx > -1) {
                    progress.hoursBySubject.labels[idx] = name.trim();
                    await progress.save();
                }
            }
        }

        if (loggedHours !== undefined) {
            let progress = await Progress.findOne({ userId: req.userId });
            if (progress) {
                const subName = updated.name;
                const idx = progress.hoursBySubject.labels.indexOf(subName);
                if (idx > -1) {
                    progress.hoursBySubject.data[idx] = Number(loggedHours);
                } else {
                    progress.hoursBySubject.labels.push(subName);
                    progress.hoursBySubject.data.push(Number(loggedHours));
                }
                await progress.save();
            }
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update subject." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found." });
        }

        let progress = await Progress.findOne({ userId: req.userId });
        if (progress) {
            const idx = progress.hoursBySubject.labels.indexOf(subject.name);
            if (idx > -1) {
                progress.hoursBySubject.labels.splice(idx, 1);
                progress.hoursBySubject.data.splice(idx, 1);
                await progress.save();
            }
        }

        res.json({ message: "Subject deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete subject." });
    }
});

module.exports = router;