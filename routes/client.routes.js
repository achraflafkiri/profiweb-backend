const express = require("express");
const {
createClient,
deleteClient,
getClients
} = require("../controllers/clientController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

// Public routes
router.route("/").get(getClients).post(createClient);

router.route("/:id").delete(deleteClient);

module.exports = router;