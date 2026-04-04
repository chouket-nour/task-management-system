const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request  = require("supertest");
const jwt      = require("jsonwebtoken");
const app      = require("../app");

let mongoServer;

const managerToken  = jwt.sign({ id: "manager123", role: "MANAGER" }, "supersecret");
const employeeToken = jwt.sign({ id: "emp123",     role: "EMPLOYEE" }, "supersecret");
const mH = { Authorization: `Bearer ${managerToken}` };
const eH = { Authorization: `Bearer ${employeeToken}` };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Conge Service", () => {

  let congeId;

  describe("POST /api/conges", () => {
    it(" Soumettre congé payé", async () => {
      const res = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Emp Test",
          managerId:    "manager123",
          type:         "Congé payé",
          startDate:    "2026-04-01",
          endDate:      "2026-04-05",
          dateDebut:    "2026-04-01",
          dateFin:      "2026-04-05",
          days:         5,
          reason:       "Vacances"
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("En attente");
      expect(res.body.employeeId).toBe("emp123"); // ← depuis JWT
      congeId = res.body._id;
    });

    it("Soumettre RTT", async () => {
      const res = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Emp Test",
          managerId:    "manager123",
          type:         "RTT",
          startDate:    "2026-04-10",
          endDate:      "2026-04-10",
          dateDebut:    "2026-04-10",
          dateFin:      "2026-04-10",
          days:         1
        });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("RTT");
    });

    it(" Soumettre congé maladie", async () => {
      const res = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Emp Test",
          managerId:    "manager123",
          type:         "Congé maladie",
          startDate:    "2026-04-15",
          endDate:      "2026-04-16",
          dateDebut:    "2026-04-15",
          dateFin:      "2026-04-16",
          days:         2
        });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("Congé maladie");
    });

    it(" Type par défaut Congé payé", async () => {
      const res = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Emp Test",
          managerId:    "manager123",
          startDate:    "2026-05-01",
          endDate:      "2026-05-02",
          dateDebut:    "2026-05-01",
          dateFin:      "2026-05-02"
        });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("Congé payé");
    });

    it(" managerId manquant", async () => {
      const res = await request(app).post("/api/conges").set(eH)
        .send({
          startDate: "2026-04-01",
          endDate:   "2026-04-05",
          dateDebut: "2026-04-01",
          dateFin:   "2026-04-05"
        });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).post("/api/conges")
        .send({ employeeName: "Test", managerId: "manager123" });
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).post("/api/conges")
        .set({ Authorization: "Bearer tokeninvalide" })
        .send({ employeeName: "Test", managerId: "manager123" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/conges/my", () => {
    it("Récupérer mes congés", async () => {
      const res = await request(app).get("/api/conges/my").set(eH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it(" Congés appartiennent à emp123", async () => {
      const res = await request(app).get("/api/conges/my").set(eH);
      expect(res.body.every(c => c.employeeId === "emp123")).toBe(true);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/conges/my");
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).get("/api/conges/my")
        .set({ Authorization: "Bearer tokeninvalide" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/conges/all", () => {
    it(" Manager récupère tous les congés", async () => {
      const res = await request(app).get("/api/conges/all").set(mH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it(" Employee ne peut pas accéder à /all", async () => {
      const res = await request(app).get("/api/conges/all").set(eH);
      expect(res.status).toBe(403);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/conges/all");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/conges/:id", () => {
    it(" Approuver un congé", async () => {
      const res = await request(app).patch(`/api/conges/${congeId}`).set(mH)
        .send({ status: "Approuvé" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Approuvé");
    });

    it(" Refuser un congé avec note", async () => {
      const newConge = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Test",
          managerId:    "manager123",
          type:         "RTT",
          startDate:    "2026-05-01",
          endDate:      "2026-05-01",
          dateDebut:    "2026-05-01",
          dateFin:      "2026-05-01",
          days:         1
        });
      const res = await request(app).patch(`/api/conges/${newConge.body._id}`).set(mH)
        .send({ status: "Refusé", managerNote: "Non disponible" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Refusé");
    });

    it(" Employee ne peut pas approuver", async () => {
      const res = await request(app).patch(`/api/conges/${congeId}`).set(eH)
        .send({ status: "Approuvé" });
      expect(res.status).toBe(403);
    });

    it(" ID invalide", async () => {
      const res = await request(app).patch("/api/conges/invalidid").set(mH)
        .send({ status: "Approuvé" });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).patch(`/api/conges/${congeId}`)
        .send({ status: "Approuvé" });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/conges/:id", () => {
    it(" Supprimer un congé", async () => {
      const newConge = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Test",
          managerId:    "manager123",
          type:         "RTT",
          startDate:    "2026-06-01",
          endDate:      "2026-06-01",
          dateDebut:    "2026-06-01",
          dateFin:      "2026-06-01",
          days:         1
        });
      const res = await request(app).delete(`/api/conges/${newConge.body._id}`).set(eH);
      expect(res.status).toBe(200);
    });

    it(" Congé déjà supprimé", async () => {
      const newConge = await request(app).post("/api/conges").set(eH)
        .send({
          employeeName: "Test",
          managerId:    "manager123",
          startDate:    "2026-07-01",
          endDate:      "2026-07-01",
          dateDebut:    "2026-07-01",
          dateFin:      "2026-07-01"
        });
      await request(app).delete(`/api/conges/${newConge.body._id}`).set(eH);
      const res = await request(app).delete(`/api/conges/${newConge.body._id}`).set(eH);
      expect(res.status).toBe(404);
    });

    it(" Sans token", async () => {
      const res = await request(app).delete(`/api/conges/${congeId}`);
      expect(res.status).toBe(401);
    });
  });
});