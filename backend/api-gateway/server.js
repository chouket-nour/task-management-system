const express = require("express");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
//application configurable selon l’environnement (cloud w local)
const AUTH_SERVICE    = process.env.AUTH_SERVICE_URL    || "http://127.0.0.1:5001";
const USER_SERVICE    = process.env.USER_SERVICE_URL    || "http://127.0.0.1:5002";
const TASK_SERVICE    = process.env.TASK_SERVICE_URL    || "http://127.0.0.1:5003";
const PROJECT_SERVICE = process.env.PROJECT_SERVICE_URL || "http://127.0.0.1:5004";
const CONGE_SERVICE   = process.env.CONGE_SERVICE_URL   || "http://127.0.0.1:5005";
const NOTIF_SERVICE   = process.env.NOTIF_SERVICE_URL   || "http://127.0.0.1:5006";
// makeProxy :  réutilisable pour chaque service
const makeProxy = (target, prefix) => createProxyMiddleware({ 
  target,
  changeOrigin: true,
  pathRewrite: (path) => `${prefix}${path}`,
  on: {
    proxyReq: (proxyReq, req) => { fixRequestBody(proxyReq, req); },
    error:    (err, req, res) => { res.status(500).json({ message: "Gateway error: " + err.message }); }
  }
});

app.use("/api/auth",          makeProxy(AUTH_SERVICE,    "/api/auth"));
app.use("/api/users",         makeProxy(USER_SERVICE,    "/api/users"));
app.use("/api/tasks",         makeProxy(TASK_SERVICE,    "/api/tasks"));
app.use("/api/projects",      makeProxy(PROJECT_SERVICE, "/api/projects"));
app.use("/api/conges",        makeProxy(CONGE_SERVICE,   "/api/conges"));
app.use("/api/notifications", makeProxy(NOTIF_SERVICE,   "/api/notifications"));

app.listen(5000, () => console.log("API Gateway running on port 5000"));