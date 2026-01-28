const express = require("express");
const {
    createProject,
    getProjectById,
    archiveProject,
    getAllProjects,
    getArchivedProjects,
    restoreProject,
    createOrUpdateQuestions,
    getQuestionsByProject,
    deleteProject,
    updateProject
} = require("../controllers/projectController");
const { protect } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

router.use(protect);

// Public routes
router.route("/")
    .get(getAllProjects)
    .post(createProject);

router.route("/archived")
    .get(getArchivedProjects);

// These specific routes should come BEFORE the general :id route
router.route("/:id/archived")
    .patch(archiveProject);

router.route("/:id/restore")
    .patch(restoreProject);

// Question routes should also come before the general :id route
router.route("/:id/questions")
    .get(getQuestionsByProject)
    .patch(createOrUpdateQuestions);

// General project CRUD routes - should come LAST
router.route("/:id")
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);

module.exports = router;