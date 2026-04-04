const Project = require("../models/Project");

exports.getAll = async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getByMember = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.params.userId });
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const project = new Project({
      name:        req.body.name,
      description: req.body.description,
      dept:        req.body.dept,
      deadline:    req.body.deadline,
      members:     req.body.members || [],
      ownerId:     req.user.id,
      status:      "En cours",
    });
    await project.save();
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id); // ✅ vérifie existence
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    res.json({ message: "Projet supprimé" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};