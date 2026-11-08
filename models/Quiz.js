const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
    attemptNumber: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    upToMarkCount: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    results: {
        type: Array,
        default: []
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["mcq", "short_answer", "mixed"],
        default: "mcq"
    },
    difficulty: {
        type: String,
        default: "medium"
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    questions: {
        type: Array,
        default: []
    },
    attemptsCount: {
        type: Number,
        default: 0
    },
    bestScore: {
        type: Number,
        default: null
    },
    lastScore: {
        type: Number,
        default: null
    },
    attempts: {
        type: [quizAttemptSchema],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Quiz", quizSchema);