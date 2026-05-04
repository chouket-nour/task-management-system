require("dotenv").config();
const express       = require("express");
const cors          = require("cors");
const mongoose      = require("mongoose");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.use(cors());
app.use(express.json());

//  Health check EN PREMIER
app.get("/health", (req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
        status:  ok ? "UP" : "DEGRADED",
        service: "project-service",
        mongo:   ok ? "connected" : "disconnected"
    });
});

// Routes APRÈS
app.use("/", projectRoutes);
app.use("/api/projects", projectRoutes);

module.exports = app;