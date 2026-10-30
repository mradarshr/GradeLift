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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/GradeLift";

let isConnected = false;
async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
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

app.use(express.static(path.join(__dirname, "public")));

const apiRouter = express.Router();

apiRouter.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        return res.status(500).json({ error: err.message || "Database connection failed." });
    }
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/timetable", timetableRoutes);
apiRouter.use("/notes", noteRoutes);
apiRouter.use("/exams", examRoutes);
apiRouter.use("/progress", progressRoutes);

app.use("/api", apiRouter);

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
    mongoose.connect(MONGODB_URI, {
        dbName: "GradeLift",
        serverSelectionTimeoutMS: 5000
    })
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
