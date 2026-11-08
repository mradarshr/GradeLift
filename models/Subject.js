const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        default: ""
    },
    color: {
        type: String,
        default: "#7c3aed"
    },
    instructor: {
        type: String,
        trim: true,
        default: ""
    },
    targetGrade: {
        type: String,
        trim: true,
        default: "A"
    },
    weeklyGoalHours: {
        type: Number,
        default: 5
    },
    loggedHours: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Subject", subjectSchema);