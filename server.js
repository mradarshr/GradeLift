require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const timetableRoutes = require("./routes/timetable");
const noteRoutes = require("./routes/notes");
const examRoutes = require("./routes/exams");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gradelift";

let isConnected = false;
async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) {
        try {
            await connectToDatabase();
        } catch (err) {
            return res.status(500).json({ error: "Database connection failed." });
        }
    }
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/progress", progressRoutes);

const pages = ["login", "signup", "dashboard", "timetable", "tasks", "pomodoro", "progress", "notes", "exam-countdown"];

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

pages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, "public", `${page}.html`));
    });
});

if (require.main === module) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log("Connected to MongoDB successfully.");
            app.listen(PORT, () => {
                console.log(`GradeLift server is running on http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err.message);
            console.log("Ensure MongoDB is running or update MONGODB_URI in .env");
            app.listen(PORT, () => {
                console.log(`GradeLift server started on http://localhost:${PORT} (waiting for MongoDB)`);
            });
        });
}

module.exports = app;
