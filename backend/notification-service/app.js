require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const notifRoutes = require("./routes/notifRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", notifRoutes);
app.use("/api/notifications", notifRoutes);

module.exports = app;