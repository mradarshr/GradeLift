const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
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
    subject: {
        type: String,
        trim: true,
        default: ""
    },
    due: {
        type: String,
        required: true
    },
    done: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Task", taskSchema);
