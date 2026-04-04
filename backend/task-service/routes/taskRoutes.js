const router     = require("express").Router();
const controller = require("../controllers/taskController");
const auth       = require("../middleware/authMiddleware");

router.get("/project/:projectId",  auth, controller.getByProject);
router.get("/member/:userId",      auth, controller.getByMember);
router.post("/",                   auth, controller.createTask);
router.patch("/:id",               auth, controller.updateTask);
router.delete("/:id",              auth, controller.deleteTask);

module.exports = router;