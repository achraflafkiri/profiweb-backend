const express = require("express");
const {
    createProject,
    getProjectById,
    deleteProject,
    getAllProjects
} = require("../controllers/projectController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

// Public routes
router.route("/")
    .get(getAllProjects)
    .post(createProject);

router.route("/:id")
    .get(getProjectById)
    .delete(deleteProject);

module.exports = router;