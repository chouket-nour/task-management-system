require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const mongoose    = require("mongoose");
const congeRoutes = require("./routes/congeRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", congeRoutes);
app.use("/api/conges", congeRoutes);

app.get("/health", (req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({
        status:  ok ? "UP" : "DEGRADED",
        service: "conge-service",
        mongo:   ok ? "connected" : "disconnected"
    });
});

module.exports = app;