const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Note = require("../models/Note");
const Progress = require("../models/Progress");
const auth = require("../middleware/auth");

router.use(auth);

function buildFallbackQuiz(title, content, type, count, difficulty) {
    const cleanText = (content || "").replace(/\r\n/g, "\n").trim();
    const sentences = cleanText
        .split(/[.\n;]+/)
        .map(s => s.trim())
        .filter(s => s.length > 25);

    const questions = [];
    const targetCount = Math.min(Math.max(count || 5, 1), 10);
    const mode = type || "mcq";

    const extractedFacts = [];
    for (const s of sentences) {
        if (s.includes(" is ") || s.includes(" are ") || s.includes(" means ") || s.includes(" defined as ") || s.includes(" called ")) {
            extractedFacts.push(s);
        }
    }

    const pool = extractedFacts.length >= 3 ? extractedFacts : (sentences.length > 0 ? sentences : [
        `${title} is a fundamental concept requiring mastery of core principles and applications.`,
        `Effective understanding of ${title} relies on structured practice, review, and retention.`,
        `Key components of ${title} interact systematically to produce predictable academic outcomes.`,
        `Advanced mastery in ${title} enables faster problem solving and comprehensive analytical reasoning.`
    ]);

    for (let i = 0; i < targetCount; i++) {
        const sentence = pool[i % pool.length];
        const isAnswerType = mode === "short_answer" || (mode === "mixed" && i % 2 === 1);

        if (isAnswerType) {
            questions.push({
                id: i + 1,
                type: "short_answer",
                question: `Explain the core concept and significance of: "${sentence.slice(0, 80)}..." according to your notes.`,
                modelAnswer: sentence,
                keyPoints: [
                    `Explains the foundational definition based on: "${sentence.slice(0, 40)}"`,
                    "Uses accurate terminology and clear context",
                    "Demonstrates practical comprehension of the principle"
                ],
                difficulty: difficulty
            });
        } else {
            const words = sentence.split(" ").filter(w => w.length > 4);
            const keyWord = words[Math.floor(words.length / 2)] || "concept";
            const blanked = sentence.replace(new RegExp(`\\b${keyWord}\\b`, "i"), "_______");

            const distractors = [
                "Alternative factor",
                "Secondary variable",
                "External constraint",
                "Inverse correlation"
            ];

            const options = [keyWord, distractors[0], distractors[1], distractors[2]].sort(() => Math.random() - 0.5);

            questions.push({
                id: i + 1,
                type: "mcq",
                question: `Complete the key statement from ${title}: "${blanked}"`,
                options: options,
                answer: keyWord,
                explanation: `According to your note: "${sentence}"`,
                difficulty: difficulty
            });
        }
    }

    return {
        title: title || "Study Notes Quiz",
        type: mode,
        difficulty: difficulty,
        questions: questions
    };
}

function evaluateAnswerFallback(question, modelAnswer, keyPoints, userAnswer) {
    const student = (userAnswer || "").trim().toLowerCase();
    const model = (modelAnswer || "").toLowerCase();
    const keys = (Array.isArray(keyPoints) ? keyPoints : []).map(k => String(k).toLowerCase());

    if (!student || student.length < 5) {
        return {
            score: 0,
            isUpToMark: false,
            status: "Incomplete",
            feedback: "Answer is too short or empty. Please elaborate on the key points mentioned in your notes.",
            matchedPoints: [],
            missingPoints: keys.length ? keys : ["Main definition and explanation"],
            modelAnswer: modelAnswer
        };
    }

    const studentWords = new Set(student.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2));
    const modelWords = model.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);

    let wordMatches = 0;
    for (const w of modelWords) {
        if (studentWords.has(w)) wordMatches++;
    }

    const wordCoverage = modelWords.length > 0 ? (wordMatches / modelWords.length) : 0.5;

    const matched = [];
    const missing = [];
    for (const kp of keys) {
        const kpWords = kp.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3);
        let hits = 0;
        for (const kw of kpWords) {
            if (studentWords.has(kw)) hits++;
        }
        if (hits >= Math.max(1, Math.floor(kpWords.length * 0.35))) {
            matched.push(kp);
        } else {
            missing.push(kp);
        }
    }

    let calculatedScore = Math.round(wordCoverage * 50 + (matched.length / Math.max(keys.length, 1)) * 40 + Math.min(student.length / 5, 10));
    calculatedScore = Math.max(10, Math.min(100, calculatedScore));

    const isUpToMark = calculatedScore >= 60;
    let status = "Needs Improvement";
    let feedback = "Your answer covers basic ideas but misses essential specifics and terminology from the notes.";

    if (calculatedScore >= 85) {
        status = "Excellent";
        feedback = "Outstanding response! Accurate, detailed, and directly reflects the core concept with strong clarity.";
    } else if (calculatedScore >= 65) {
        status = "Good";
        feedback = "Solid answer that captures the main principles. You can strengthen it by addressing the remaining nuances.";
    }

    return {
        score: calculatedScore,
        isUpToMark: isUpToMark,
        status: status,
        feedback: feedback,
        matchedPoints: matched,
        missingPoints: missing,
        modelAnswer: modelAnswer
    };
}

router.post("/generate", async (req, res) => {
    try {
        let { noteId, title, content, type, count, difficulty } = req.body;
        count = parseInt(count, 10) || 5;
        difficulty = difficulty || "medium";
        type = type || "mcq";

        if (noteId) {
            const note = await Note.findOne({ _id: noteId, userId: req.userId });
            if (note) {
                title = title || note.title;
                content = content || note.content;
            }
        }

        if (!title && !content) {
            return res.status(400).json({ error: "Please select a note or enter content to generate a quiz." });
        }

        title = title || "Custom Study Notes";
        content = content || title;

        const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
        if (workerUrl && typeof fetch === "function") {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(`${workerUrl.replace(/\/+$/, "")}/generate-quiz`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, content, type, count, difficulty }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const aiData = await response.json();
                    if (aiData && Array.isArray(aiData.questions) && aiData.questions.length > 0) {
                        return res.json({
                            source: "cloudflare-ai",
                            title: aiData.title || title,
                            type: type,
                            difficulty: difficulty,
                            questions: aiData.questions
                        });
                    }
                }
            } catch (err) {
            }
        }

        const fallbackQuiz = buildFallbackQuiz(title, content, type, count, difficulty);
        res.json({
            source: "local-engine",
            ...fallbackQuiz
        });
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to generate quiz." });
    }
});

router.post("/analyze", async (req, res) => {
    try {
        const { question, modelAnswer, keyPoints, userAnswer } = req.body;

        const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
        if (workerUrl && typeof fetch === "function") {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(`${workerUrl.replace(/\/+$/, "")}/analyze-answer`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question, modelAnswer, keyPoints, userAnswer }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const analysis = await response.json();
                    if (analysis && typeof analysis.score !== "undefined") {
                        return res.json({
                            source: "cloudflare-ai",
                            ...analysis
                        });
                    }
                }
            } catch (err) {
            }
        }

        const evaluation = evaluateAnswerFallback(question, modelAnswer, keyPoints, userAnswer);
        res.json({
            source: "local-engine",
            ...evaluation
        });
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to analyze answer." });
    }
});

router.post("/save", async (req, res) => {
    try {
        const { noteId, title, type, difficulty, totalQuestions, score, questions, results } = req.body;

        const quiz = new Quiz({
            userId: req.userId,
            noteId: noteId || undefined,
            title: title || "Study Quiz",
            type: type || "mcq",
            difficulty: difficulty || "medium",
            totalQuestions: Number(totalQuestions) || (questions ? questions.length : 0),
            score: Number(score) || 0,
            questions: Array.isArray(questions) ? questions : [],
            results: Array.isArray(results) ? results : [],
            completedAt: new Date()
        });

        await quiz.save();

        await Progress.findOneAndUpdate(
            { userId: req.userId },
            { $inc: { sessionsCompleted: 1 }, $set: { updatedAt: new Date() } },
            { upsert: true }
        );

        res.status(201).json({ success: true, quiz });
    } catch (err) {
        res.status(500).json({ error: err.message || "Failed to save quiz attempt." });
    }
});

router.get("/history", async (req, res) => {
    try {
        const quizzes = await Quiz.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(20);
        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch quiz history." });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
        if (!quiz) {
            return res.status(404).json({ error: "Quiz attempt not found." });
        }
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch quiz." });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!quiz) {
            return res.status(404).json({ error: "Quiz not found." });
        }
        res.json({ message: "Quiz deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete quiz." });
    }
});

module.exports = router;