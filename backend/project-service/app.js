require("dotenv").config();
const express       = require("express");
const cors          = require("cors");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.use(cors());
app.use(express.json());


app.use("/", projectRoutes);
app.use("/api/projects", projectRoutes);

module.exports = app;