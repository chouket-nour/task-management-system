jest.mock("axios");
const axios = require("axios");
axios.post.mockResolvedValue({ data: { success: true } });

// Le reste du fichier identique
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request  = require("supertest");
const app      = require("../app");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Auth Service", () => {

  describe("POST /api/auth/signup", () => {
    it(" Créer un compte EMPLOYEE", async () => {
      const res = await request(app).post("/api/auth/signup")
        .send({ name: "Test Employee", email: "employee@test.com", password: "123456", role: "EMPLOYEE" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User registered successfully");
    });

    it(" Créer un compte MANAGER", async () => {
      const res = await request(app).post("/api/auth/signup")
        .send({ name: "Test Manager", email: "manager@test.com", password: "123456", role: "MANAGER" });
      expect(res.status).toBe(200);
    });

    it(" Email déjà existant", async () => {
      await request(app).post("/api/auth/signup")
        .send({ name: "Test", email: "duplicate@test.com", password: "123456", role: "EMPLOYEE" });
      const res = await request(app).post("/api/auth/signup")
        .send({ name: "Test", email: "duplicate@test.com", password: "123456", role: "EMPLOYEE" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("User already exists");
    });

    it(" Champs manquants", async () => {
      const res = await request(app).post("/api/auth/signup")
        .send({ email: "missing@test.com" });
      expect(res.status).toBe(500);
    });

    it(" Rôle invalide", async () => {
      const res = await request(app).post("/api/auth/signup")
        .send({ name: "Test", email: "role@test.com", password: "123456", role: "ADMIN" });
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/auth/login", () => {
    it(" Login EMPLOYEE avec succès", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "employee@test.com", password: "123456" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.role).toBe("EMPLOYEE");
    });

    it(" Login MANAGER avec succès", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "manager@test.com", password: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe("MANAGER");
    });

    it(" Token JWT valide retourné", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "employee@test.com", password: "123456" });
      expect(res.body.token.split(".").length).toBe(3);
    });

    it(" Mauvais mot de passe", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "employee@test.com", password: "mauvais" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid password");
    });

    it(" Email non existant", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "notfound@test.com", password: "123456" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("User not found");
    });

    it(" Email manquant", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ password: "123456" });
      expect(res.status).toBe(400);
    });

    it(" Password manquant", async () => {
      const res = await request(app).post("/api/auth/login")
        .send({ email: "employee@test.com" });
      expect(res.status).toBe(400);
    });
  });
});