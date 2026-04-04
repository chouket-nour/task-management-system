const Task  = require("../models/Task");
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

exports.getByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getByMember = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const task = new Task({
      title:       req.body.title,
      description: req.body.description,
      status:      req.body.status   || "À faire",
      priority:    req.body.priority || "Normale",
      assignedTo:  req.body.assignedTo,
      projectId:   req.body.projectId,
      createdBy:   req.user.id,
    });
    await task.save();

    if (task.assignedTo && task.assignedTo !== req.user.id) {
      await notify(
        task.assignedTo,
        "tache_assignee",
        "Nouvelle tâche assignée",
        `Une nouvelle tâche vous a été assignée : "${task.title}".`,
        { taskId: task._id, projectId: task.projectId }
      );
    }

    res.status(201).json(task); 
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateTask = async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const task = await Task.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );

    if (req.body.status === "Terminé" && oldTask.status !== "Terminé" && task.createdBy) {
      await notify(
        task.createdBy,
        "tache_terminee",
        "Tâche terminée ",
        `La tâche "${task.title}" a été marquée comme terminée.`,
        { taskId: task._id, projectId: task.projectId }
      );
    }

    if (req.body.assignedTo && req.body.assignedTo !== oldTask.assignedTo) {
      await notify(
        req.body.assignedTo,
        "tache_assignee",
        "Tâche assignée",
        `La tâche "${task.title}" vous a été assignée.`,
        { taskId: task._id, projectId: task.projectId }
      );
    }

    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};