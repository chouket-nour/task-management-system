/**
 * Tests UNITAIRES — projectController
 * (avec mock : Project)
 */
jest.mock("../models/Project");

const projectController = require("../controllers/projectController");
const Project = require("../models/Project");

/* Helper req/res */
const makeReqRes = (user = {}, body = {}, params = {}) => {
  const req = { user, body, params };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return { req, res };
};

describe("projectController", () => {

  beforeEach(() => jest.clearAllMocks());

  /* ===================================================== */
  /* create                                                 */
  /* ===================================================== */
  describe("create", () => {

    it("crée un projet et le retourne", async () => {
      const fakeProject = {
        _id:     "p1",
        name:    "Projet Test",
        ownerId: "manager123",
        status:  "En cours",
        members: [],
        save:    jest.fn().mockResolvedValue(undefined),
      };
      Project.mockImplementation(() => fakeProject);

      const { req, res } = makeReqRes(
        { id: "manager123" },
        { name: "Projet Test", dept: "Cloud", deadline: "2026-06-30", members: [] }
      );

      await projectController.create(req, res);

      expect(fakeProject.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeProject);
    });

    it("définit ownerId depuis req.user.id", async () => {
      const fakeProject = {
        ownerId: "manager123",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Project.mockImplementation(() => fakeProject);

      const { req, res } = makeReqRes(
        { id: "manager123" },
        { name: "Projet Test", members: [] }
      );

      await projectController.create(req, res);

      expect(fakeProject.ownerId).toBe("manager123");
    });

    it("définit status à 'En cours' par défaut", async () => {
      const fakeProject = {
        status: "En cours",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Project.mockImplementation(() => fakeProject);

      const { req, res } = makeReqRes({ id: "manager123" }, { name: "Test", members: [] });

      await projectController.create(req, res);

      expect(fakeProject.status).toBe("En cours");
    });

    it("crée avec membres", async () => {
      const fakeProject = {
        members: ["emp123", "emp456"],
        save: jest.fn().mockResolvedValue(undefined),
      };
      Project.mockImplementation(() => fakeProject);

      const { req, res } = makeReqRes(
        { id: "manager123" },
        { name: "Projet Équipe", members: ["emp123", "emp456"] }
      );

      await projectController.create(req, res);

      expect(fakeProject.members.length).toBe(2);
    });

    it("retourne 500 si save() échoue", async () => {
      Project.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB error")),
      }));

      const { req, res } = makeReqRes({ id: "manager123" }, { name: "Test" });

      await projectController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* getAll                                                 */
  /* ===================================================== */
  describe("getAll", () => {

    it("retourne tous les projets", async () => {
      const fakeProjects = [{ _id: "p1" }, { _id: "p2" }];
      Project.find = jest.fn().mockResolvedValue(fakeProjects);

      const { req, res } = makeReqRes({ role: "MANAGER" });

      await projectController.getAll(req, res);

      expect(Project.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeProjects);
    });

    it("retourne un tableau vide si aucun projet", async () => {
      Project.find = jest.fn().mockResolvedValue([]);

      const { req, res } = makeReqRes({ role: "MANAGER" });

      await projectController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("retourne 500 si find() échoue", async () => {
      Project.find = jest.fn().mockRejectedValue(new Error("DB crash"));

      const { req, res } = makeReqRes();

      await projectController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* getOne                                                 */
  /* ===================================================== */
  describe("getOne", () => {

    it("retourne le projet correspondant à l'id", async () => {
      const fakeProject = { _id: "p1", name: "Projet Test" };
      Project.findById = jest.fn().mockResolvedValue(fakeProject);

      const { req, res } = makeReqRes({}, {}, { id: "p1" });

      await projectController.getOne(req, res);

      expect(Project.findById).toHaveBeenCalledWith("p1");
      expect(res.json).toHaveBeenCalledWith(fakeProject);
    });

    it("projet introuvable → 404", async () => {
      Project.findById = jest.fn().mockResolvedValue(null);

      const { req, res } = makeReqRes({}, {}, { id: "ghost" });

      await projectController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("erreur → 500", async () => {
      Project.findById = jest.fn().mockRejectedValue(new Error("DB crash"));

      const { req, res } = makeReqRes({}, {}, { id: "bad" });

      await projectController.getOne(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* getByMember                                            */
  /* ===================================================== */
  describe("getByMember", () => {

    it("retourne les projets d'un membre", async () => {
      const fakeProjects = [{ _id: "p1", members: ["emp123"] }];
      Project.find = jest.fn().mockResolvedValue(fakeProjects);

      const { req, res } = makeReqRes({}, {}, { userId: "emp123" });

      await projectController.getByMember(req, res);

      expect(Project.find).toHaveBeenCalledWith({ members: "emp123" });
      expect(res.json).toHaveBeenCalledWith(fakeProjects);
    });

    it("membre sans projets → tableau vide", async () => {
      Project.find = jest.fn().mockResolvedValue([]);

      const { req, res } = makeReqRes({}, {}, { userId: "nouser999" });

      await projectController.getByMember(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("erreur → 500", async () => {
      Project.find = jest.fn().mockRejectedValue(new Error("DB crash"));

      const { req, res } = makeReqRes({}, {}, { userId: "emp123" });

      await projectController.getByMember(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* update                                                 */
  /* ===================================================== */
  describe("update", () => {

    it("met à jour et retourne le projet modifié", async () => {
      const fakeProject = { _id: "p1", name: "Projet Modifié" };
      Project.findByIdAndUpdate = jest.fn().mockResolvedValue(fakeProject);

      const { req, res } = makeReqRes(
        {},
        { name: "Projet Modifié", dept: "Cloud", members: [] },
        { id: "p1" }
      );

      await projectController.update(req, res);

      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        "p1", req.body, { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(fakeProject);
    });

    it("projet introuvable → 404", async () => {
      Project.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const { req, res } = makeReqRes({}, { name: "Test" }, { id: "ghost" });

      await projectController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("erreur → 500", async () => {
      Project.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("DB error"));

      const { req, res } = makeReqRes({}, { name: "Test" }, { id: "bad" });

      await projectController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* remove                                                 */
  /* ===================================================== */
  describe("remove", () => {

    it("supprime un projet existant", async () => {
      Project.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: "p1" });

      const { req, res } = makeReqRes({}, {}, { id: "p1" });

      await projectController.remove(req, res);

      expect(Project.findByIdAndDelete).toHaveBeenCalledWith("p1");
      expect(res.json).toHaveBeenCalledWith({ message: "Projet supprimé" });
    });

    it("projet introuvable → 404", async () => {
      Project.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const { req, res } = makeReqRes({}, {}, { id: "ghost" });

      await projectController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("erreur → 500", async () => {
      Project.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("DB error"));

      const { req, res } = makeReqRes({}, {}, { id: "bad" });

      await projectController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});