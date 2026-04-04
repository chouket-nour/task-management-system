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

describe("Project Service", () => {

  let projectId;

  describe("POST /api/projects", () => {
    it(" Créer un projet", async () => {
      const res = await request(app).post("/api/projects").set(mH)
        .send({ name: "Projet Test", dept: "Cloud", deadline: "2026-06-30", members: [] });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Projet Test");
      expect(res.body.status).toBe("En cours");
      expect(res.body.ownerId).toBe("manager123");
      projectId = res.body._id;
    });

    it(" Créer avec membres", async () => {
      const res = await request(app).post("/api/projects").set(mH)
        .send({ name: "Projet Équipe", dept: "Data", members: ["emp123", "emp456"] });
      expect(res.status).toBe(200);
      expect(res.body.members.length).toBe(2);
    });

    it(" Créer avec description", async () => {
      const res = await request(app).post("/api/projects").set(mH)
        .send({ name: "Projet Desc", dept: "Cloud", description: "Une description", members: [] });
      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Une description");
    });

    it(" Nom manquant", async () => {
      const res = await request(app).post("/api/projects").set(mH)
        .send({ dept: "Cloud" });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).post("/api/projects")
        .send({ name: "Projet Sans Auth" });
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).post("/api/projects")
        .set({ Authorization: "Bearer tokeninvalide" })
        .send({ name: "Projet Test" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/projects", () => {
    it("Récupérer tous les projets", async () => {
      const res = await request(app).get("/api/projects").set(mH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/projects/:id", () => {
    it(" Récupérer par ID", async () => {
      const res = await request(app).get(`/api/projects/${projectId}`).set(mH);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(projectId);
    });

    it(" ID invalide", async () => {
      const res = await request(app).get("/api/projects/invalidid").set(mH);
      expect(res.status).toBe(500);
    });

    it(" Projet inexistant", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/projects/${fakeId}`).set(mH);
      expect(res.status).toBe(404);
    });

    it(" Sans token", async () => {
      const res = await request(app).get(`/api/projects/${projectId}`);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/projects/member/:userId", () => {
    it(" Récupérer projets d'un membre", async () => {
      const res = await request(app).get("/api/projects/member/emp123").set(eH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it(" Membre sans projets retourne tableau vide", async () => {
      const res = await request(app).get("/api/projects/member/nouser999").set(eH);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/projects/member/emp123");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/projects/:id", () => {
    it(" Mettre à jour nom", async () => {
      const res = await request(app).put(`/api/projects/${projectId}`).set(mH)
        .send({ name: "Projet Modifié", dept: "Cloud", members: [] });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Projet Modifié");
    });

    it(" Ajouter membre", async () => {
      const res = await request(app).put(`/api/projects/${projectId}`).set(mH)
        .send({ name: "Projet Modifié", dept: "Cloud", members: ["emp123"] });
      expect(res.status).toBe(200);
      expect(res.body.members).toContain("emp123");
    });

    it(" ID invalide", async () => {
      const res = await request(app).put("/api/projects/invalidid").set(mH)
        .send({ name: "Test" });
      expect(res.status).toBe(500);
    });

    it(" Projet inexistant", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/projects/${fakeId}`).set(mH)
        .send({ name: "Test" });
      expect(res.status).toBe(404);
    });

    it(" Sans token", async () => {
      const res = await request(app).put(`/api/projects/${projectId}`)
        .send({ name: "Test" });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it(" Supprimer un projet", async () => {
      const res = await request(app).delete(`/api/projects/${projectId}`).set(mH);
      expect(res.status).toBe(200);
    });

    it(" Projet déjà supprimé", async () => {
      const res = await request(app).delete(`/api/projects/${projectId}`).set(mH);
      expect(res.status).toBe(404);
    });

    it(" ID invalide", async () => {
      const res = await request(app).delete("/api/projects/invalidid").set(mH);
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).delete(`/api/projects/${projectId}`);
      expect(res.status).toBe(401);
    });
  });
});