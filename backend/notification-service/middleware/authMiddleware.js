const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "supersecret"); // ← fallback ajouté
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};