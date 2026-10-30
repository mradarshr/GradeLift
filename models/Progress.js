const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    tasksPerDay: {
        labels: {
            type: [String],
            default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        },
        data: {
            type: [Number],
            default: [0, 0, 0, 0, 0, 0, 0]
        }
    },
    hoursBySubject: {
        labels: {
            type: [String],
            default: ["Math", "Physics", "Chemistry", "English", "CS"]
        },
        data: {
            type: [Number],
            default: [0, 0, 0, 0, 0]
        }
    },
    sessionsCompleted: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Progress", progressSchema);
