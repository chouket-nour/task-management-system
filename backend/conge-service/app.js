require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const congeRoutes = require("./routes/congeRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", congeRoutes);
app.use("/api/conges", congeRoutes);

module.exports = app;