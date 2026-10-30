const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("../routes/auth");
const taskRoutes = require("../routes/tasks");
const timetableRoutes = require("../routes/timetable");
const noteRoutes = require("../routes/notes");
const examRoutes = require("../routes/exams");
const progressRoutes = require("../routes/progress");

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;
async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is missing. Please set it in Vercel project settings.");
    }
    await mongoose.connect(MONGODB_URI, {
        dbName: "GradeLift",
        serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(500).json({ error: err.message || "Database connection failed." });
    }
});

const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/timetable", timetableRoutes);
apiRouter.use("/notes", noteRoutes);
apiRouter.use("/exams", examRoutes);
apiRouter.use("/progress", progressRoutes);

app.use("/api", apiRouter);
app.use("/", apiRouter);

module.exports = app;
