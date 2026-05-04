require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const mongoose    = require("mongoose");
const notifRoutes = require("./routes/notifRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", notifRoutes);
app.use("/api/notifications", notifRoutes);

app.get("/health", (req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
        status:  ok ? "UP" : "DEGRADED",
        service: "notification-service",
        mongo:   ok ? "connected" : "disconnected"
    });
});

module.exports = app;