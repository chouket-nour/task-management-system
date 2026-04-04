const mongoose = require("mongoose");

const notifSchema = new mongoose.Schema({
  userId:   { type: String, required: true }, // destinataire
  type:     { type: String, enum: ["conge_demande", "conge_decision", "tache_assignee", "tache_terminee"], required: true },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  meta:     { type: Object }, // données supplémentaires
}, { timestamps: true });

module.exports = mongoose.model("Notification", notifSchema);