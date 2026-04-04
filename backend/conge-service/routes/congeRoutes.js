const router = require("express").Router();
const ctrl   = require("../controllers/congeController");
const auth   = require("../middleware/authMiddleware");

router.post("/",          auth, ctrl.demanderConge);
router.get("/all",        auth, ctrl.getConges);
router.get("/",           auth, ctrl.getConges);
router.get("/my",         auth, ctrl.getMesConges);
router.get("/mes-conges", auth, ctrl.getMesConges);
router.put("/:id",        auth, ctrl.repondreConge);
router.patch("/:id",      auth, ctrl.repondreConge);
router.delete("/:id",     auth, ctrl.deleteConge);  

module.exports = router;