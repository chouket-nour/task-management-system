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

describe("User Service", () => {

  let userId;

  describe("POST /api/users", () => {
    it(" Créer un profil employé", async () => {
      const res = await request(app).post("/api/users")
        .send({ authId: "emp123", name: "Test Emp", email: "emp@test.com", role: "EMPLOYEE" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Emp");
      userId = res.body._id;
    });

    it(" Créer un profil manager", async () => {
      const res = await request(app).post("/api/users")
        .send({ authId: "manager123", name: "Test Manager", email: "mgr@test.com", role: "MANAGER" });
      expect(res.status).toBe(201);
    });

    it(" authId manquant", async () => {
      const res = await request(app).post("/api/users")
        .send({ name: "No AuthId" });
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/users", () => {
    it(" Récupérer tous les utilisateurs", async () => {
      const res = await request(app).get("/api/users").set(mH);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("Sans token", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it(" Récupérer par authId", async () => {
      const res = await request(app).get("/api/users/emp123").set(eH);
      expect(res.status).toBe(200);
      expect(res.body.authId).toBe("emp123");
    });

    it(" Utilisateur non trouvé", async () => {
      const res = await request(app).get("/api/users/nonexistent999").set(mH);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it(" Mettre à jour département", async () => {
      const res = await request(app).patch("/api/users/emp123")
        .set(eH).send({ department: "Cloud" });
      expect(res.status).toBe(200);
      expect(res.body.department).toBe("Cloud");
    });

    it(" Mettre à jour téléphone", async () => {
      const res = await request(app).patch("/api/users/emp123")
        .set(eH).send({ phone: "+216 12 345 678" });
      expect(res.status).toBe(200);
    });

    it(" Mettre à jour bio", async () => {
      const res = await request(app).patch("/api/users/emp123")
        .set(eH).send({ bio: "Dev Cloud" });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/users/attendance", () => {
    it(" Enregistrer Sur site", async () => {
      const res = await request(app).post("/api/users/attendance")
        .set(eH).send({ date: "2026-03-24", mode: "Sur site" });
      expect(res.status).toBe(200);
    });

    it(" Enregistrer Télétravail", async () => {
      const res = await request(app).post("/api/users/attendance")
        .set(eH).send({ date: "2026-03-25", mode: "Télétravail" });
      expect(res.status).toBe(200);
    });

    it(" Enregistrer Congé", async () => {
      const res = await request(app).post("/api/users/attendance")
        .set(eH).send({ date: "2026-03-26", mode: "Congé" });
      expect(res.status).toBe(200);
    });

    it(" Mode invalide", async () => {
      const res = await request(app).post("/api/users/attendance")
        .set(eH).send({ date: "2026-03-27", mode: "InvalidMode" });
      expect(res.status).toBe(500);
    });

    it(" Sans token", async () => {
      const res = await request(app).post("/api/users/attendance")
        .send({ date: "2026-03-24", mode: "Sur site" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users/attendance/:userId", () => {
    it(" Récupérer calendrier présence", async () => {
      const res = await request(app).get("/api/users/attendance/emp123").set(eH);
      expect(res.status).toBe(200);
      expect(res.body["2026-03-24"]).toBe("Sur site");
    });

    it(" Retourne objet vide si pas de présence", async () => {
      const res = await request(app).get("/api/users/attendance/nouser999").set(mH);
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBe(0);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it(" Supprimer un utilisateur", async () => {
      const res = await request(app).delete(`/api/users/${userId}`).set(mH);
      expect(res.status).toBe(200);
    });
  });
});