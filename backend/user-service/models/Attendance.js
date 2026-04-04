const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date:   { type: String, required: true },
  mode:   { type: String, enum: ["Sur site", "Télétravail", "Congé"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Attendance", attendanceSchema);