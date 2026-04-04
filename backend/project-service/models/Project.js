const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  dept:        { type: String },
  deadline:    { type: String },
  ownerId:     { type: String, required: true },
  members:     [{ type: String }],
  status:      { type: String, default: "En cours" },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project", projectSchema);