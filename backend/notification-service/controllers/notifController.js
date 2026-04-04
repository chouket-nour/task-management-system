const Notification = require("../models/Notification");

exports.create = async (req, res) => {
  try {
    const notif = new Notification(req.body);
    await notif.save();

    //  Vérifier que io existe avant de l'utiliser 
    const io = req.app.get("io");
    if (io) {
      io.to(notif.userId).emit("notification", notif);
    }

    res.json(notif);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMine = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id); // ✅ vérifie existence
    if (!notif) return res.status(404).json({ message: "Notification non trouvée" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};