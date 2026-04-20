/**
 * Tests unitaires — authController
 */

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("axios");

const authController = require("../controllers/authController");
const User           = require("../models/User");
const bcrypt         = require("bcryptjs");
const jwt            = require("jsonwebtoken");
const axios          = require("axios");

// 🔐 JWT
beforeAll(() => {
  process.env.JWT_SECRET = "testsecret";
});

/* Helper */
const makeReqRes = (body = {}) => {
  const req = { body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return { req, res };
};

/* ======================================================= */
/* signup */
/* ======================================================= */
describe("authController.signup", () => {

  beforeEach(() => jest.clearAllMocks());

  it("crée l'utilisateur Nour", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed_password");

    const savedUser = {
      _id: "uid123",
      name: "Nour",
      email: "nour@test.com",
      role: "EMPLOYEE",
      save: jest.fn().mockResolvedValue(true),
    };

    User.mockImplementation(() => savedUser);
    axios.post.mockResolvedValue({ data: { success: true } });

    const { req, res } = makeReqRes({
      name: "Nour",
      email: "nour@test.com",
      password: "123456",
      role: "EMPLOYEE",
    });

    await authController.signup(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
    });
  });

  it("crée l'utilisateur Ahmed", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed");

    User.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));

    axios.post.mockResolvedValue({});

    const { req, res } = makeReqRes({
      name: "Ahmed",
      email: "ahmed@test.com",
      password: "123456",
      role: "MANAGER",
    });

    await authController.signup(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
    });
  });

  it("email déjà existant", async () => {
    User.findOne.mockResolvedValue({ email: "nour@test.com" });

    const { req, res } = makeReqRes({
      name: "Nour",
      email: "nour@test.com",
      password: "123456",
      role: "EMPLOYEE",
    });

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("erreur DB", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed");

    User.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("DB error")),
    }));

    const { req, res } = makeReqRes({
      name: "Ahmed",
      email: "ahmed@test.com",
      password: "123456",
      role: "MANAGER",
    });

    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("password hashé", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed123");

    let createdUser;
    User.mockImplementation((data) => {
      createdUser = data;
      return { save: jest.fn().mockResolvedValue(true) };
    });

    axios.post.mockResolvedValue({});

    const { req, res } = makeReqRes({
      name: "Nour",
      email: "nour@test.com",
      password: "plain",
      role: "EMPLOYEE",
    });

    await authController.signup(req, res);

    expect(createdUser.password).toBe("hashed123");
  });
});

/* ======================================================= */
/* login */
/* ======================================================= */
describe("authController.login", () => {

  const fakeUser = {
    _id: "uid456",
    name: "Nour",
    email: "nour@test.com",
    role: "EMPLOYEE",
    password: "hashed_password",
  };

  beforeEach(() => jest.clearAllMocks());

  it("login Nour OK", async () => {
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token123");

    const { req, res } = makeReqRes({
      email: "nour@test.com",
      password: "123456",
    });

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: "token123",
      role: "EMPLOYEE",
      name: "Nour",
    });
  });

  it("login Ahmed OK", async () => {
    User.findOne.mockResolvedValue({
      ...fakeUser,
      name: "Ahmed",
      email: "ahmed@test.com",
      role: "MANAGER",
    });

    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token456");

    const { req, res } = makeReqRes({
      email: "ahmed@test.com",
      password: "123456",
    });

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith({
      token: "token456",
      role: "MANAGER",
      name: "Ahmed",
    });
  });

  it("user introuvable", async () => {
    User.findOne.mockResolvedValue(null);

    const { req, res } = makeReqRes({
      email: "notfound@test.com",
      password: "123456",
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("mot de passe incorrect", async () => {
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(false);

    const { req, res } = makeReqRes({
      email: "nour@test.com",
      password: "wrong",
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("erreur DB", async () => {
    User.findOne.mockRejectedValue(new Error("DB crash"));

    const { req, res } = makeReqRes({
      email: "nour@test.com",
      password: "123456",
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});