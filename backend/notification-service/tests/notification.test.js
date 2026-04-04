const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request  = require("supertest");
const jwt      = require("jsonwebtoken");
const app      = require("../app");

let mongoServer;

const employeeToken = jwt.sign({ id: "emp123", role: "EMPLOYEE" }, "supersecret");
const managerToken  = jwt.sign({ id: "mgr123", role: "MANAGER" },  "supersecret");
const eH = { Authorization: `Bearer ${employeeToken}` };
const mH = { Authorization: `Bearer ${managerToken}` };

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Notification Service", () => {

  let notifId;

  describe("POST /api/notifications", () => {
    it(" Créer notification conge_demande", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "conge_demande", title: "Nouvelle demande", message: "Congé demandé" });
      expect(res.status).toBe(200);
      expect(res.body.read).toBe(false);
      expect(res.body.userId).toBe("emp123");
      notifId = res.body._id;
    });

    it(" Créer notification tache_assignee", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "tache_assignee", title: "Nouvelle tâche", message: "Tâche assignée" });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("tache_assignee");
    });

    it(" Créer notification conge_decision", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "conge_decision", title: "Congé Approuvé", message: "Approuvé" });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("conge_decision");
    });

    it(" Créer notification tache_terminee", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "mgr123", type: "tache_terminee", title: "Tâche terminée", message: "Terminée" });
      expect(res.status).toBe(200);
      expect(res.body.type).toBe("tache_terminee");
    });

    it(" Créer avec meta", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "conge_demande", title: "Test Meta", message: "Test", meta: { congeId: "abc123" } });
      expect(res.status).toBe(200);
      expect(res.body.meta.congeId).toBe("abc123");
    });

    it(" Type invalide", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "invalid_type", title: "Test", message: "Test" });
      expect(res.status).toBe(500);
    });
    it(" userId manquant", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ type: "conge_demande", title: "Test", message: "Test" });
      expect(res.status).toBe(500);
    });

    it(" title manquant", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "conge_demande", message: "Test" });
      expect(res.status).toBe(500);
    });

    it(" message manquant", async () => {
      const res = await request(app).post("/api/notifications")
        .send({ userId: "emp123", type: "conge_demande", title: "Test" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/notifications/mine", () => {
    it(" Récupérer mes notifications", async () => {
      const res = await request(app).get("/api/notifications/mine").set(eH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it(" Notifications appartiennent à emp123", async () => {
      const res = await request(app).get("/api/notifications/mine").set(eH);
      expect(res.body.every(n => n.userId === "emp123")).toBe(true);
    });

    it(" Notifications non lues par défaut", async () => {
      // Nouveau utilisateur avec notifications fraîches
      await request(app).post("/api/notifications")
        .send({ userId: "newuser", type: "conge_demande", title: "Test", message: "Test" });
      const newToken = jwt.sign({ id: "newuser", role: "EMPLOYEE" }, "supersecret");
      const res = await request(app).get("/api/notifications/mine")
        .set({ Authorization: `Bearer ${newToken}` });
      expect(res.body.every(n => n.read === false)).toBe(true);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/notifications/mine");
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).get("/api/notifications/mine")
        .set({ Authorization: "Bearer tokeninvalide" });
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it(" Marquer toutes comme lues", async () => {
      const res = await request(app).patch("/api/notifications/read-all")
        .set(eH).send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it(" Vérifier que toutes sont lues", async () => {
      const res = await request(app).get("/api/notifications/mine").set(eH);
      expect(res.body.every(n => n.read === true)).toBe(true);
    });

    it(" Sans token", async () => {
      const res = await request(app).patch("/api/notifications/read-all").send({});
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).patch("/api/notifications/read-all")
        .set({ Authorization: "Bearer tokeninvalide" }).send({});
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it(" Supprimer une notification", async () => {
      const res = await request(app).delete(`/api/notifications/${notifId}`).set(eH);
      expect(res.status).toBe(200);
    });

    it(" Notification déjà supprimée", async () => {
      const res = await request(app).delete(`/api/notifications/${notifId}`).set(eH);
      expect(res.status).toBe(404);
    });

    it(" ID invalide", async () => {
      const res = await request(app).delete("/api/notifications/invalidid").set(eH);
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).delete(`/api/notifications/${notifId}`);
      expect(res.status).toBe(401);
    });
  });
});