const express = require("express");
const {
    createTemplate,
    getAllTemplates,
    deleteTemplate
} = require("../controllers/templateController");
const { protect } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

router.use(protect);

// Public routes
router.route("/")
    .post(createTemplate)
    .get(getAllTemplates);

router.route("/:id")
    .delete(deleteTemplate);

module.exports = router;