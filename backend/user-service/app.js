require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
        status:  ok ? "UP" : "DEGRADED",
        service: "user-service",
        mongo:   ok ? "connected" : "disconnected"
    });
});

// Routes APRÈS
app.use("/", userRoutes);
app.use("/api/users", userRoutes);

module.exports = app;