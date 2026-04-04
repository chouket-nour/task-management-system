const router = require("express").Router();
const ctrl   = require("../controllers/notifController");
const auth   = require("../middleware/authMiddleware");

router.post("/",          ctrl.create);       // appelé par les autres services (interne)
router.get("/mine",       auth, ctrl.getMine);
router.patch("/read-all", auth, ctrl.markRead);
router.delete("/:id",     auth, ctrl.remove);

module.exports = router;