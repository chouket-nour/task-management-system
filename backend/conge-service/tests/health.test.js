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

describe("GET /health - conge-service", () => {
  it("should return 200 when DB is connected", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("UP");
    expect(res.body.service).toBe("conge-service");
    expect(res.body.mongo).toBe("connected");
  });

  it("should return 503 when DB is disconnected", async () => {
    await mongoose.connection.close();
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe("DEGRADED");
    expect(res.body.mongo).toBe("disconnected");
    await mongoose.connect(mongoServer.getUri());
  });
});