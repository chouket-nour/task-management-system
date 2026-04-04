const Conge = require("../models/Conge");
const axios = require("axios");

const NOTIF_URL = process.env.NOTIF_SERVICE_URL || "http://localhost:5006/api/notifications";

const notify = async (userId, type, title, message, meta = {}) => {
  if (!userId) return;
  try {
    await axios.post(NOTIF_URL, { userId, type, title, message, meta });
  } catch (err) {
    console.error("[NOTIFY ERROR]", err.message);
  }
};

exports.demanderConge = async (req, res) => {
  try {
    const dateDebut = req.body.startDate || req.body.dateDebut;
    const dateFin   = req.body.endDate   || req.body.dateFin;
    const motif     = req.body.reason    || req.body.motif;

    const conge = new Conge({
      employeeId:   req.user.id,
      employeeName: req.body.employeeName,
      managerId:    req.body.managerId,
      dateDebut,
      dateFin,
      startDate:    dateDebut,
      endDate:      dateFin,
      days:         req.body.days,
      motif,
      reason:       motif,
      type:         req.body.type || "Congé payé",
    });

    await conge.save();

    await notify(
      req.body.managerId,
      "conge_demande",
      "Nouvelle demande de congé",
      `${req.body.employeeName || "Un employé"} a soumis une demande de congé du ${dateDebut} au ${dateFin}.`,
      { congeId: conge._id, employeeId: req.user.id }
    );

    res.json(conge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConges = async (req, res) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const conges = await Conge.find().sort({ createdAt: -1 });
    res.json(conges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMesConges = async (req, res) => {
  try {
    const conges = await Conge.find({ employeeId: req.user.id }).sort({ createdAt: -1 });
    res.json(conges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.repondreConge = async (req, res) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const conge = await Conge.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!conge) return res.status(404).json({ message: "Congé non trouvé" });

    await notify(
      conge.employeeId,
      "conge_decision",
      `Congé ${req.body.status}`,
      `Votre demande de congé du ${conge.dateDebut} au ${conge.dateFin} a été ${req.body.status.toLowerCase()}.`,
      { congeId: conge._id, status: req.body.status }
    );

    res.json(conge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteConge = async (req, res) => {
  try {
    const conge = await Conge.findByIdAndDelete(req.params.id);
    if (!conge) return res.status(404).json({ message: "Congé non trouvé" });
    res.json({ message: "Congé supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};