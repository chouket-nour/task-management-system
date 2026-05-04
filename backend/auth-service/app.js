require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const mongoose    = require("mongoose");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", authRoutes);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
        status:  ok ? "UP" : "DEGRADED",
        service: "auth-service",
        mongo:   ok ? "connected" : "disconnected"
    });
});

module.exports = app;