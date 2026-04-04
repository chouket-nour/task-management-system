const router = require("express").Router();
const ctrl   = require("../controllers/projectController");
const auth   = require("../middleware/authMiddleware");

router.get("/",               auth,              ctrl.getAll);
router.get("/member/:userId", auth,              ctrl.getByMember);
router.get("/:id",            auth,              ctrl.getOne);
router.post("/",              auth,              ctrl.create);    
router.put("/:id",            auth,              ctrl.update);    
router.delete("/:id",         auth,              ctrl.remove);    

module.exports = router;