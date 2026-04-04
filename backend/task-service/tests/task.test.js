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

describe("Task Service", () => {

  let taskId;

  describe("POST /api/tasks", () => {
    it(" Créer une tâche À faire", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Tâche Test", projectId: "proj123", priority: "Haute", status: "À faire" });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Tâche Test");
      expect(res.body.status).toBe("À faire");
      taskId = res.body._id;
    });

    it(" Créer une tâche avec assignedTo", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Tâche Assignée", projectId: "proj123", priority: "Normale", assignedTo: "emp123" });
      expect(res.status).toBe(201);
      expect(res.body.assignedTo).toBe("emp123");
    });

    it(" Priorité par défaut Normale", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Tâche Défaut", projectId: "proj123" });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe("Normale");
    });

    it(" Status par défaut À faire", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Tâche Status Défaut", projectId: "proj123" });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("À faire");
    });

    it(" createdBy depuis JWT", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Tâche CreatedBy", projectId: "proj123" });
      expect(res.status).toBe(201);
      expect(res.body.createdBy).toBe("manager123");
    });

    it(" Titre manquant", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ projectId: "proj123" });
      expect(res.status).toBe(500);
    });

    it(" ProjectId manquant", async () => {
      const res = await request(app).post("/api/tasks").set(mH)
        .send({ title: "Sans Projet" });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).post("/api/tasks")
        .send({ title: "Test", projectId: "proj123" });
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).post("/api/tasks")
        .set({ Authorization: "Bearer tokeninvalide" })
        .send({ title: "Test", projectId: "proj123" });
      expect(res.status).toBe(401);
    });

    it(" Employee ne peut pas créer une tâche", async () => {
      const res = await request(app).post("/api/tasks").set(eH)
        .send({ title: "Test Employee", projectId: "proj123" });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/tasks/project/:projectId", () => {
    it(" Récupérer tâches d'un projet", async () => {
      const res = await request(app).get("/api/tasks/project/proj123").set(mH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it(" Projet vide retourne tableau vide", async () => {
      const res = await request(app).get("/api/tasks/project/emptyproj").set(mH);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/tasks/project/proj123");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/tasks/member/:userId", () => {
    it(" Récupérer tâches d'un employé", async () => {
      const res = await request(app).get("/api/tasks/member/emp123").set(eH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it(" Employé sans tâches retourne vide", async () => {
      const res = await request(app).get("/api/tasks/member/nouser").set(eH);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    it(" Sans token", async () => {
      const res = await request(app).get("/api/tasks/member/emp123");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/tasks/:id", () => {
    it(" Statut En cours", async () => {
      const res = await request(app).patch(`/api/tasks/${taskId}`)
        .set(eH).send({ status: "En cours" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("En cours");
    });

    it(" Statut Terminé", async () => {
      const res = await request(app).patch(`/api/tasks/${taskId}`)
        .set(eH).send({ status: "Terminé" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Terminé");
    });

    it(" Priorité Basse", async () => {
      const res = await request(app).patch(`/api/tasks/${taskId}`)
        .set(mH).send({ priority: "Basse" });
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe("Basse");
    });

    it(" Mise à jour description", async () => {
      const res = await request(app).patch(`/api/tasks/${taskId}`)
        .set(mH).send({ description: "Nouvelle description" });
      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Nouvelle description");
    });

    it(" ID invalide", async () => {
      const res = await request(app).patch("/api/tasks/invalidid")
        .set(mH).send({ status: "En cours" });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).patch(`/api/tasks/${taskId}`)
        .send({ status: "En cours" });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it(" Supprimer une tâche", async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`).set(mH);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Task deleted");
    });

    it("Tâche déjà supprimée", async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`).set(mH);
      expect(res.status).toBe(404);
    });

    it(" Sans token", async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`);
      expect(res.status).toBe(401);
    });

    it(" Token invalide", async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`)
        .set({ Authorization: "Bearer tokeninvalide" });
      expect(res.status).toBe(401);
    });
  });
});