const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  description:{ type: String },
  status:     { type: String, enum: ["À faire", "En cours", "Terminé"], default: "À faire" },
  priority:   { type: String, enum: ["Basse", "Normale", "Haute"], default: "Normale" },
  assignedTo: { type: String },  // authId de l'employé
  createdBy:  { type: String },  // authId du manager
  projectId:  { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);