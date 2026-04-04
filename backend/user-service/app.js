require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", userRoutes);
app.use("/api/users", userRoutes);

module.exports = app;