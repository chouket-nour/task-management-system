/**
 * Tests unitaires — User Controller
 * mongoose, UserProfile et Attendance sont entièrement mockés.
 */

jest.mock("mongoose", () => {
  const actual = jest.requireActual("mongoose");
  return {
    ...actual,
    Types: {
      ObjectId: {
        isValid: jest.fn(),
      },
    },
  };
});

jest.mock("../models/UserProfile");
jest.mock("../models/Attendance");

const mongoose   = require("mongoose");
const User       = require("../models/UserProfile");
const Attendance = require("../models/Attendance");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  checkIn,
  getAttendance,
} = require("../controllers/userController");

// ─── helpers ────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const authReq = (body = {}, params = {}, user = { id: "user123", role: "EMPLOYEE" }) => ({
  body,
  params,
  user,
});

afterEach(() => jest.clearAllMocks());

// ─── getUsers ────────────────────────────────────────────────────────────────

describe("getUsers", () => {
  it("retourne la liste de tous les utilisateurs", async () => {
    const users = [{ name: "Alice" }, { name: "Bob" }];
    User.find.mockResolvedValue(users);

    const req = authReq();
    const res = mockRes();

    await getUsers(req, res);

    expect(User.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it("retourne un tableau vide si aucun utilisateur", async () => {
    User.find.mockResolvedValue([]);

    const req = authReq();
    const res = mockRes();

    await getUsers(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("retourne 500 si erreur DB", async () => {
    User.find.mockRejectedValue(new Error("DB error"));

    const req = authReq();
    const res = mockRes();

    await getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});

// ─── getUser ─────────────────────────────────────────────────────────────────

describe("getUser", () => {
  it("trouve un utilisateur par authId", async () => {
    const user = { authId: "auth123", name: "Alice" };
    User.findOne.mockResolvedValue(user);

    const req = authReq({}, { id: "auth123" });
    const res = mockRes();

    await getUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ authId: "auth123" });
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("trouve un utilisateur par ObjectId si authId introuvable", async () => {
    const user = { _id: "64abc123", name: "Bob" };
    User.findOne.mockResolvedValue(null);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue(user);

    const req = authReq({}, { id: "64abc123" });
    const res = mockRes();

    await getUser(req, res);

    expect(User.findById).toHaveBeenCalledWith("64abc123");
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("retourne 404 si ni authId ni ObjectId ne correspondent", async () => {
    User.findOne.mockResolvedValue(null);
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = authReq({}, { id: "inconnu" });
    const res = mockRes();

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("retourne 404 si ObjectId valide mais aucun document", async () => {
    User.findOne.mockResolvedValue(null);
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValue(null);

    const req = authReq({}, { id: "64abc999" });
    const res = mockRes();

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("retourne 500 si erreur DB", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));

    const req = authReq({}, { id: "auth123" });
    const res = mockRes();

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── createUser ──────────────────────────────────────────────────────────────

describe("createUser", () => {
  it("crée et retourne un utilisateur", async () => {
    const body = { authId: "auth1", name: "Alice", email: "a@a.com", role: "EMPLOYEE" };
    const saved = { ...body, _id: "uid1" };

    const mockSave = jest.fn().mockResolvedValue(saved);
    User.mockImplementation(() => ({ ...saved, save: mockSave }));

    const req = authReq(body);
    const res = mockRes();

    await createUser(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("retourne 500 si save() échoue", async () => {
    User.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("validation error")),
    }));

    const req = authReq({ name: "X" });
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "validation error" });
  });
});

// ─── updateUser ──────────────────────────────────────────────────────────────

describe("updateUser", () => {
  it("met à jour via authId et retourne l'utilisateur", async () => {
    const updated = { authId: "auth1", name: "Alice Updated" };
    User.findOneAndUpdate.mockResolvedValue(updated);

    const req = authReq({ name: "Alice Updated" }, { id: "auth1" });
    const res = mockRes();

    await updateUser(req, res);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { authId: "auth1" },
      { $set: { name: "Alice Updated" } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("replie sur findByIdAndUpdate si authId ne correspond pas", async () => {
    const updated = { _id: "uid1", name: "Bob Updated" };
    User.findOneAndUpdate.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const req = authReq({ name: "Bob Updated" }, { id: "uid1" });
    const res = mockRes();

    await updateUser(req, res);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "uid1",
      { $set: { name: "Bob Updated" } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("retourne 404 si aucune correspondance", async () => {
    User.findOneAndUpdate.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);

    const req = authReq({ name: "X" }, { id: "inconnu" });
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("retourne 500 si erreur DB", async () => {
    User.findOneAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = authReq({ name: "X" }, { id: "auth1" });
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── deleteUser ──────────────────────────────────────────────────────────────

describe("deleteUser", () => {
  it("supprime un utilisateur et retourne le message de confirmation", async () => {
    User.findByIdAndDelete.mockResolvedValue({ _id: "uid1", name: "Alice" });

    const req = authReq({}, { id: "uid1" });
    const res = mockRes();

    await deleteUser(req, res);

    expect(User.findByIdAndDelete).toHaveBeenCalledWith("uid1");
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted" });
  });

  it("retourne 404 si l'utilisateur n'existe pas", async () => {
    User.findByIdAndDelete.mockResolvedValue(null);

    const req = authReq({}, { id: "inconnu" });
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("retourne 500 si erreur DB", async () => {
    User.findByIdAndDelete.mockRejectedValue(new Error("DB error"));

    const req = authReq({}, { id: "uid1" });
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});

// ─── checkIn ─────────────────────────────────────────────────────────────────

describe("checkIn", () => {
  it("enregistre une présence Sur site", async () => {
    const record = { userId: "user123", date: "2024-06-01", mode: "Sur site" };
    Attendance.findOneAndUpdate.mockResolvedValue(record);

    const req = authReq({ date: "2024-06-01", mode: "Sur site" });
    const res = mockRes();

    await checkIn(req, res);

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", date: "2024-06-01" },
      { mode: "Sur site" },
      { upsert: true, returnDocument: "after" }
    );
    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("enregistre une présence Télétravail", async () => {
    const record = { userId: "user123", date: "2024-06-02", mode: "Télétravail" };
    Attendance.findOneAndUpdate.mockResolvedValue(record);

    const req = authReq({ date: "2024-06-02", mode: "Télétravail" });
    const res = mockRes();

    await checkIn(req, res);

    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("enregistre une absence Congé", async () => {
    const record = { userId: "user123", date: "2024-06-03", mode: "Congé" };
    Attendance.findOneAndUpdate.mockResolvedValue(record);

    const req = authReq({ date: "2024-06-03", mode: "Congé" });
    const res = mockRes();

    await checkIn(req, res);

    expect(res.json).toHaveBeenCalledWith(record);
  });

  it("retourne 500 si le mode est invalide", async () => {
    const req = authReq({ date: "2024-06-01", mode: "Inconnu" });
    const res = mockRes();

    await checkIn(req, res);

    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Mode invalide" });
  });

  it("retourne 500 si erreur DB", async () => {
    Attendance.findOneAndUpdate.mockRejectedValue(new Error("DB error"));

    const req = authReq({ date: "2024-06-01", mode: "Sur site" });
    const res = mockRes();

    await checkIn(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });

  it("utilise req.user.id comme userId", async () => {
    Attendance.findOneAndUpdate.mockResolvedValue({});

    const req = authReq(
      { date: "2024-06-01", mode: "Sur site" },
      {},
      { id: "manager999", role: "MANAGER" }
    );
    const res = mockRes();

    await checkIn(req, res);

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "manager999" }),
      expect.anything(),
      expect.anything()
    );
  });
});

// ─── getAttendance ───────────────────────────────────────────────────────────

describe("getAttendance", () => {
  it("retourne les présences formatées en objet date→mode", async () => {
    const records = [
      { date: "2024-06-01", mode: "Sur site" },
      { date: "2024-06-02", mode: "Télétravail" },
    ];
    Attendance.find.mockResolvedValue(records);

    const req = authReq({}, { userId: "user123" });
    const res = mockRes();

    await getAttendance(req, res);

    expect(Attendance.find).toHaveBeenCalledWith({ userId: "user123" });
    expect(res.json).toHaveBeenCalledWith({
      "2024-06-01": "Sur site",
      "2024-06-02": "Télétravail",
    });
  });

  it("retourne un objet vide si aucun enregistrement", async () => {
    Attendance.find.mockResolvedValue([]);

    const req = authReq({}, { userId: "user123" });
    const res = mockRes();

    await getAttendance(req, res);

    expect(res.json).toHaveBeenCalledWith({});
  });

  it("retourne 500 si erreur DB", async () => {
    Attendance.find.mockRejectedValue(new Error("DB error"));

    const req = authReq({}, { userId: "user123" });
    const res = mockRes();

    await getAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});