require("dotenv").config();
const mongoose   = require("mongoose");
const http       = require("http");
const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const app        = require("./app");

const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Notification DB connected"))
  .catch(err => console.log(err));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch { next(new Error("Invalid token")); }
});

io.on("connection", (socket) => {
  console.log(`[WS] User ${socket.userId} connected`);
  socket.join(socket.userId);
  socket.on("disconnect", () =>
    console.log(`[WS] User ${socket.userId} disconnected`)
  );
});

const PORT = process.env.PORT || 5006;
server.listen(PORT, () =>
  console.log(`Notification service running on port ${PORT}`)
);