/**
 * Tests UNITAIRES — notifController
 * (avec mocks : Notification)
 */
jest.mock("../models/Notification");

const notifController = require("../controllers/notifController");
const Notification = require("../models/Notification");

/* Helper req/res */
const makeReqRes = (user = {}, body = {}, params = {}) => {
  const req = {
    user,
    body,
    params,
    app: { get: jest.fn().mockReturnValue(null) }, // io désactivé par défaut
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return { req, res };
};

describe("notifController", () => {

  beforeEach(() => jest.clearAllMocks());

  /* ===================================================== */
  /* create                                                 */
  /* ===================================================== */
  describe("create", () => {

    it("crée une notification et retourne le document", async () => {
      const fakeNotif = {
        _id: "n1",
        userId: "emp123",
        type: "conge_demande",
        read: false,
        save: jest.fn().mockResolvedValue(undefined),
      };
      Notification.mockImplementation(() => fakeNotif);

      const { req, res } = makeReqRes(
        {},
        { userId: "emp123", type: "conge_demande", title: "Nouvelle demande", message: "Congé demandé" }
      );

      await notifController.create(req, res);

      expect(fakeNotif.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(fakeNotif);
    });

    it("émet via socket.io si io est disponible", async () => {
      const fakeNotif = {
        userId: "emp123",
        save: jest.fn().mockResolvedValue(undefined),
      };
      Notification.mockImplementation(() => fakeNotif);

      const mockRoom = { emit: jest.fn() };
      const mockIo   = { to: jest.fn().mockReturnValue(mockRoom) };

      const { req, res } = makeReqRes({}, { userId: "emp123" });
      req.app.get = jest.fn().mockReturnValue(mockIo);

      await notifController.create(req, res);

      expect(mockIo.to).toHaveBeenCalledWith("emp123");
      expect(mockRoom.emit).toHaveBeenCalledWith("notification", fakeNotif);
    });

    it("ne plante pas si io est absent", async () => {
      const fakeNotif = { userId: "emp123", save: jest.fn().mockResolvedValue(undefined) };
      Notification.mockImplementation(() => fakeNotif);

      const { req, res } = makeReqRes({}, { userId: "emp123" });
      req.app.get = jest.fn().mockReturnValue(null);

      await expect(notifController.create(req, res)).resolves.not.toThrow();
    });

    it("retourne 500 si save() échoue", async () => {
      Notification.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB error")),
      }));

      const { req, res } = makeReqRes({}, { userId: "emp123" });

      await notifController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* getMine                                                */
  /* ===================================================== */
  describe("getMine", () => {

    it("retourne les notifications de l'utilisateur connecté", async () => {
      const fakeNotifs = [
        { _id: "n1", userId: "emp123", read: false },
        { _id: "n2", userId: "emp123", read: false },
      ];
      Notification.find = jest.fn().mockReturnValue({
        sort:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(fakeNotifs),
      });

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.getMine(req, res);

      expect(Notification.find).toHaveBeenCalledWith({ userId: "emp123" });
      expect(res.json).toHaveBeenCalledWith(fakeNotifs);
    });

    it("applique sort({ createdAt: -1 }) et limit(50)", async () => {
      const sortMock  = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue([]);
      Notification.find = jest.fn().mockReturnValue({ sort: sortMock, limit: limitMock });

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.getMine(req, res);

      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limitMock).toHaveBeenCalledWith(50);
    });

    it("n'inclut pas les notifications d'un autre utilisateur", async () => {
      const fakeNotifs = [{ userId: "emp123" }];
      Notification.find = jest.fn().mockReturnValue({
        sort:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(fakeNotifs),
      });

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.getMine(req, res);

      expect(Notification.find).not.toHaveBeenCalledWith({ userId: "mgr123" });
    });

    it("retourne 500 si find() échoue", async () => {
      Notification.find = jest.fn().mockReturnValue({
        sort:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("DB crash")),
      });

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.getMine(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* markRead                                               */
  /* ===================================================== */
  describe("markRead", () => {

    it("marque toutes les notifications de l'utilisateur comme lues", async () => {
      Notification.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 3 });

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.markRead(req, res);

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { userId: "emp123" },
        { read: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("ne touche pas les notifications d'un autre utilisateur", async () => {
      Notification.updateMany = jest.fn().mockResolvedValue({});

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.markRead(req, res);

      expect(Notification.updateMany).not.toHaveBeenCalledWith(
        { userId: "mgr123" },
        expect.anything()
      );
    });

    it("retourne 500 si updateMany() échoue", async () => {
      Notification.updateMany = jest.fn().mockRejectedValue(new Error("DB error"));

      const { req, res } = makeReqRes({ id: "emp123" });

      await notifController.markRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  /* ===================================================== */
  /* remove                                                 */
  /* ===================================================== */
  describe("remove", () => {

    it("supprime une notification existante", async () => {
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: "n1" });

      const { req, res } = makeReqRes({}, {}, { id: "n1" });

      await notifController.remove(req, res);

      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith("n1");
      expect(res.json).toHaveBeenCalledWith({ message: "Deleted" });
    });

    it("notification introuvable → 404", async () => {
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const { req, res } = makeReqRes({}, {}, { id: "ghost" });

      await notifController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("erreur → 500", async () => {
      Notification.findByIdAndDelete = jest.fn().mockRejectedValue(new Error("DB error"));

      const { req, res } = makeReqRes({}, {}, { id: "bad" });

      await notifController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});