const router = require("express").Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// ← Routes spécifiques AVANT /:id
router.post("/attendance",        authMiddleware, userController.checkIn);
router.get("/attendance/:userId", authMiddleware, userController.getAttendance);

router.get("/",      authMiddleware, userController.getUsers);
router.get("/:id",   authMiddleware, userController.getUser);
router.post("/",     userController.createUser);
router.patch("/:id", authMiddleware, userController.updateUser);
router.delete("/:id",authMiddleware, userController.deleteUser);

module.exports = router;