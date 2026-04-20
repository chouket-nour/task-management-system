const mongoose   = require("mongoose"); 
const User       = require("../models/UserProfile");
const Attendance = require("../models/Attendance");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    let user = await User.findOne({ authId: req.params.id });
    if (!user) {
      const isValidId = mongoose.Types.ObjectId.isValid(req.params.id); 
      if (isValidId) user = await User.findById(req.params.id);
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    let user = await User.findOneAndUpdate(
      { authId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!user) user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkIn = async (req, res) => {
  const { date, mode } = req.body;
  const userId = req.user.id;
  try {
    const validModes = ["Sur site", "Télétravail", "Congé"]; // validation manuelle
    if (!validModes.includes(mode)) {
      return res.status(500).json({ message: "Mode invalide" });
    }

    const record = await Attendance.findOneAndUpdate(
      { userId, date },
      { mode },
      { upsert: true, returnDocument: "after" }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.params.userId });
    const result = {};
    records.forEach(r => { result[r.date] = r.mode; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};