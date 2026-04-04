const mongoose = require("mongoose");

const congeSchema = new mongoose.Schema({
  employeeId:   { type: String, required: true },
  employeeName: { type: String },
  managerId:    { type: String, required: true },
  dateDebut:    { type: String, required: true  },
  dateFin:      { type: String ,required: true },
  startDate:    { type: String , required: true   },
  endDate:      { type: String ,required: true },
  days:         { type: Number },
  motif:        { type: String },
  reason:       { type: String },
  type:         { type: String, default: "Congé payé" },
  status:       {
    type: String,
    enum: ["En attente", "Approuvé", "Refusé"],
    default: "En attente"
  }
}, { timestamps: true });

module.exports = mongoose.model("Conge", congeSchema);