/**
 * Tests unitaires — Task Controller
 * On mocke mongoose (Task) et axios pour isoler la logique métier.
 */

jest.mock("../models/Task");
jest.mock("axios");

const Task  = require("../models/Task");
const axios = require("axios");

const {
  getByProject,
  getByMember,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// ─── helpers ────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const managerReq = (body = {}, params = {}) => ({
  user:   { id: "manager123", role: "MANAGER" },
  body,
  params,
});

const employeeReq = (body = {}, params = {}) => ({
  user:   { id: "emp123", role: "EMPLOYEE" },
  body,
  params,
});

// Remet tous les compteurs et implémentations à zéro entre chaque test.
// Sans ça, axios.post.mock.calls s'accumule sur toute la suite.
afterEach(() => jest.clearAllMocks());

// ─── getByProject ────────────────────────────────────────────────────────────

describe("getByProject", () => {
  it("retourne les tâches du projet", async () => {
    const tasks = [{ title: "T1" }, { title: "T2" }];
    Task.find.mockResolvedValue(tasks);

    const req = { params: { projectId: "proj123" } };
    const res = mockRes();

    await getByProject(req, res);

    expect(Task.find).toHaveBeenCalledWith({ projectId: "proj123" });
    expect(res.json).toHaveBeenCalledWith(tasks);
  });

  it("retourne 500 si erreur DB", async () => {
    Task.find.mockRejectedValue(new Error("DB error"));

    const req = { params: { projectId: "proj123" } };
    const res = mockRes();

    await getByProject(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });

  it("retourne un tableau vide pour un projet sans tâches", async () => {
    Task.find.mockResolvedValue([]);

    const req = { params: { projectId: "emptyproj" } };
    const res = mockRes();

    await getByProject(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });
});

// ─── getByMember ─────────────────────────────────────────────────────────────

describe("getByMember", () => {
  it("retourne les tâches assignées à un utilisateur", async () => {
    const tasks = [{ title: "T1", assignedTo: "emp123" }];
    Task.find.mockResolvedValue(tasks);

    const req = { params: { userId: "emp123" } };
    const res = mockRes();

    await getByMember(req, res);

    expect(Task.find).toHaveBeenCalledWith({ assignedTo: "emp123" });
    expect(res.json).toHaveBeenCalledWith(tasks);
  });

  it("retourne un tableau vide si l'employé n'a pas de tâches", async () => {
    Task.find.mockResolvedValue([]);

    const req = { params: { userId: "nouser" } };
    const res = mockRes();

    await getByMember(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("retourne 500 si erreur DB", async () => {
    Task.find.mockRejectedValue(new Error("DB fail"));

    const req = { params: { userId: "emp123" } };
    const res = mockRes();

    await getByMember(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── createTask ──────────────────────────────────────────────────────────────

describe("createTask", () => {
  it("crée une tâche avec les valeurs fournies", async () => {
    const saved = {
      _id: "task001",
      title: "Tâche Test",
      status: "À faire",
      priority: "Haute",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: undefined,
    };

    const mockSave = jest.fn().mockResolvedValue(saved);
    Task.mockImplementation(() => ({ ...saved, save: mockSave }));

    const req = managerReq({
      title: "Tâche Test",
      projectId: "proj123",
      priority: "Haute",
      status: "À faire",
    });
    const res = mockRes();

    await createTask(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("applique le statut par défaut 'À faire'", async () => {
    const instance = {
      _id: "task002",
      title: "Tâche",
      status: "À faire",
      priority: "Normale",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: undefined,
      save: jest.fn().mockResolvedValue(true),
    };
    Task.mockImplementation(() => instance);

    const req = managerReq({ title: "Tâche", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(instance.status).toBe("À faire");
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("applique la priorité par défaut 'Normale'", async () => {
    const instance = {
      _id: "task003",
      title: "Tâche",
      status: "À faire",
      priority: "Normale",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: undefined,
      save: jest.fn().mockResolvedValue(true),
    };
    Task.mockImplementation(() => instance);

    const req = managerReq({ title: "Tâche", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(instance.priority).toBe("Normale");
  });

  it("enregistre createdBy depuis req.user.id", async () => {
    const instance = {
      _id: "task004",
      title: "Tâche",
      status: "À faire",
      priority: "Normale",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: undefined,
      save: jest.fn().mockResolvedValue(true),
    };
    Task.mockImplementation(() => instance);

    const req = managerReq({ title: "Tâche", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(instance.createdBy).toBe("manager123");
  });

  it("envoie une notification si assignedTo !== createdBy", async () => {
    axios.post.mockResolvedValue({});
    const instance = {
      _id: "task005",
      title: "Tâche Assignée",
      status: "À faire",
      priority: "Normale",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: "emp123",
      save: jest.fn().mockResolvedValue(true),
    };
    Task.mockImplementation(() => instance);

    const req = managerReq({
      title: "Tâche Assignée",
      projectId: "proj123",
      assignedTo: "emp123",
    });
    const res = mockRes();

    await createTask(req, res);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userId: "emp123",
        type: "tache_assignee",
      })
    );
  });

  it("n'envoie pas de notification si pas d'assignedTo", async () => {
    const instance = {
      _id: "task006",
      title: "Tâche",
      status: "À faire",
      priority: "Normale",
      projectId: "proj123",
      createdBy: "manager123",
      assignedTo: undefined,
      save: jest.fn().mockResolvedValue(true),
    };
    Task.mockImplementation(() => instance);

    const req = managerReq({ title: "Tâche", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("retourne 403 si rôle EMPLOYEE", async () => {
    const req = employeeReq({ title: "Test", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  it("retourne 500 si save() échoue", async () => {
    Task.mockImplementation(() => ({
      title: "Tâche",
      save: jest.fn().mockRejectedValue(new Error("save fail")),
    }));

    const req = managerReq({ title: "Tâche", projectId: "proj123" });
    const res = mockRes();

    await createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── updateTask ──────────────────────────────────────────────────────────────

describe("updateTask", () => {
  it("met à jour et retourne la tâche", async () => {
    const old  = { _id: "t1", status: "À faire", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old, status: "En cours" };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);

    const req = managerReq({ status: "En cours" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("retourne 404 si tâche introuvable", async () => {
    Task.findById.mockResolvedValue(null);

    const req = managerReq({ status: "En cours" }, { id: "nonexistent" });
    const res = mockRes();

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  it("envoie une notification au créateur quand statut → Terminé", async () => {
    axios.post.mockResolvedValue({});
    const old  = { _id: "t1", status: "En cours", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old, status: "Terminé", projectId: "proj123" };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);

    const req = employeeReq({ status: "Terminé" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userId: "manager123",
        type: "tache_terminee",
      })
    );
  });

  it("n'envoie pas de notif si la tâche était déjà Terminée", async () => {
    const old  = { _id: "t1", status: "Terminé", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);

    const req = managerReq({ status: "Terminé" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("envoie une notification si assignedTo change", async () => {
    axios.post.mockResolvedValue({});
    const old  = { _id: "t1", status: "À faire", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old, assignedTo: "emp456", projectId: "proj123" };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);

    const req = managerReq({ assignedTo: "emp456" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userId: "emp456",
        type: "tache_assignee",
      })
    );
  });

  it("met à jour la description sans notification", async () => {
    const old  = { _id: "t1", status: "À faire", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old, description: "Nouvelle description" };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);

    const req = managerReq({ description: "Nouvelle description" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("retourne 500 si findByIdAndUpdate échoue", async () => {
    Task.findById.mockResolvedValue({ _id: "t1", status: "À faire" });
    Task.findByIdAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = managerReq({ status: "En cours" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("continue normalement si la notification échoue (axios erreur)", async () => {
    const old  = { _id: "t1", status: "En cours", assignedTo: "emp123", createdBy: "manager123", title: "T" };
    const updated = { ...old, status: "Terminé", projectId: "proj123" };

    Task.findById.mockResolvedValue(old);
    Task.findByIdAndUpdate.mockResolvedValue(updated);
    axios.post.mockRejectedValue(new Error("NOTIF DOWN"));

    const req = employeeReq({ status: "Terminé" }, { id: "t1" });
    const res = mockRes();

    await updateTask(req, res);

    // La réponse doit quand même être OK
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

// ─── deleteTask ──────────────────────────────────────────────────────────────

describe("deleteTask", () => {
  it("supprime une tâche et retourne le message de confirmation", async () => {
    Task.findByIdAndDelete.mockResolvedValue({ _id: "t1", title: "T" });

    const req = managerReq({}, { id: "t1" });
    const res = mockRes();

    await deleteTask(req, res);

    expect(Task.findByIdAndDelete).toHaveBeenCalledWith("t1");
    expect(res.json).toHaveBeenCalledWith({ message: "Task deleted" });
  });

  it("retourne 404 si la tâche n'existe pas", async () => {
    Task.findByIdAndDelete.mockResolvedValue(null);

    const req = managerReq({}, { id: "nonexistent" });
    const res = mockRes();

    await deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  it("retourne 500 si findByIdAndDelete lève une erreur", async () => {
    Task.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    const req = managerReq({}, { id: "t1" });
    const res = mockRes();

    await deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});