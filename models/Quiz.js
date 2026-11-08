const mongoose = require("mongoose");

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
    score: {
        type: Number,
        default: 0
    },
    questions: {
        type: Array,
        default: []
    },
    results: {
        type: Array,
        default: []
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Quiz", quizSchema);
