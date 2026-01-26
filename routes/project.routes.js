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
    deleteProject
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

router.route("/:id")
    .get(getProjectById)
    .patch(archiveProject)
    .delete(deleteProject);

router.route("/:id/restore")
    .patch(restoreProject);

// create question
router.route("/:id/questions")
    .patch(createOrUpdateQuestions);

router.route("/:id/questions")
    .get(getQuestionsByProject);

module.exports = router;