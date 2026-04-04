require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", taskRoutes);
app.use("/api/tasks", taskRoutes);

module.exports = app;