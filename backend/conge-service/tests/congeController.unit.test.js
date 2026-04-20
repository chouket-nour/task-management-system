/**
 * Tests UNITAIRES — congeController
 * (avec mocks : Conge + axios)
 */
jest.mock("../models/Conge");
jest.mock("axios");

const congeController = require("../controllers/congeController");
const Conge = require("../models/Conge");
const axios = require("axios");

/* Helper req/res */
const makeReqRes = (user = {}, body = {}, params = {}) => {
  const req = { user, body, params };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

describe("congeController", () => {

  beforeEach(() => jest.clearAllMocks());

  /* ===================================================== */
  /* demanderConge */
  /* ===================================================== */
  describe("demanderConge", () => {

    it("crée un congé et notifie le manager", async () => {
      const fakeConge = {
        _id: "c1",
        save: jest.fn().mockResolvedValue(true),
      };

      Conge.mockImplementation(() => fakeConge);
      axios.post.mockResolvedValue({});

      const { req, res } = makeReqRes(
        { id: "emp123" },
        {
          employeeName: "Nour",
          managerId: "manager123",
          startDate: "2026-04-01",
          endDate: "2026-04-05",
          days: 5,
          reason: "Vacances",
        }
      );

      await congeController.demanderConge(req, res);

      expect(fakeConge.save).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalled(); // notification
      expect(res.json).toHaveBeenCalledWith(fakeConge);
    });

    it("retourne 500 si erreur DB", async () => {
      Conge.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB error")),
      }));

      const { req, res } = makeReqRes(
        { id: "emp123" },
        { managerId: "manager123" }
      );

      await congeController.demanderConge(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* getConges */
  /* ===================================================== */
  describe("getConges", () => {

    it("manager récupère les congés", async () => {
      const fakeConges = [{ id: 1 }, { id: 2 }];

      Conge.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(fakeConges),
      });

      const { req, res } = makeReqRes({ role: "MANAGER" });

      await congeController.getConges(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeConges);
    });

    it("employee interdit (403)", async () => {
      const { req, res } = makeReqRes({ role: "EMPLOYEE" });

      await congeController.getConges(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  /* ===================================================== */
  /* getMesConges */
  /* ===================================================== */
  describe("getMesConges", () => {

    it("retourne les congés de l'utilisateur", async () => {
      const fakeConges = [{ employeeId: "emp123" }];

      Conge.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(fakeConges),
      });

      const { req, res } = makeReqRes({ id: "emp123" });

      await congeController.getMesConges(req, res);

      expect(Conge.find).toHaveBeenCalledWith({ employeeId: "emp123" });
      expect(res.json).toHaveBeenCalledWith(fakeConges);
    });

    it("erreur → 500", async () => {
      Conge.find.mockImplementation(() => {
        throw new Error("DB crash");
      });

      const { req, res } = makeReqRes({ id: "emp123" });

      await congeController.getMesConges(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* repondreConge */
  /* ===================================================== */
  describe("repondreConge", () => {

    it("manager approuve un congé", async () => {
      const fakeConge = {
        _id: "c1",
        employeeId: "emp123",
        dateDebut: "2026-04-01",
        dateFin: "2026-04-05",
      };

      Conge.findByIdAndUpdate.mockResolvedValue(fakeConge);
      axios.post.mockResolvedValue({});

      const { req, res } = makeReqRes(
        { role: "MANAGER" },
        { status: "Approuvé" },
        { id: "c1" }
      );

      await congeController.repondreConge(req, res);

      expect(axios.post).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeConge);
    });

    it("employee interdit (403)", async () => {
      const { req, res } = makeReqRes(
        { role: "EMPLOYEE" },
        { status: "Approuvé" },
        { id: "c1" }
      );

      await congeController.repondreConge(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("congé introuvable → 404", async () => {
      Conge.findByIdAndUpdate.mockResolvedValue(null);

      const { req, res } = makeReqRes(
        { role: "MANAGER" },
        { status: "Approuvé" },
        { id: "c1" }
      );

      await congeController.repondreConge(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  /* ===================================================== */
  /* deleteConge */
  /* ===================================================== */
  describe("deleteConge", () => {

    it("supprime un congé", async () => {
      Conge.findByIdAndDelete.mockResolvedValue({ _id: "c1" });

      const { req, res } = makeReqRes({}, {}, { id: "c1" });

      await congeController.deleteConge(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Congé supprimé",
      });
    });

    it("congé non trouvé → 404", async () => {
      Conge.findByIdAndDelete.mockResolvedValue(null);

      const { req, res } = makeReqRes({}, {}, { id: "c1" });

      await congeController.deleteConge(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("erreur → 500", async () => {
      Conge.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

      const { req, res } = makeReqRes({}, {}, { id: "c1" });

      await congeController.deleteConge(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});