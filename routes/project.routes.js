const express = require("express");
const {
    createProject,
    getProjectById,
    archiveProject,
    getAllProjects,
    getArchivedProjects,
    restoreProject
} = require("../controllers/projectController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

// Public routes
router.route("/")
    .get(getAllProjects)
    .post(createProject);

router.route("/archived")
    .get(getArchivedProjects);

router.route("/:id")
    .get(getProjectById)
    .patch(archiveProject);

router.route("/:id/restore")
    .patch(restoreProject);

module.exports = router;