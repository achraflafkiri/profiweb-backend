const { Router } = require("express");
const { getAllGroups, createGroup, refuseRequest, acceptRequest, askToJoin, getGroupById, getAllGroupsCategories, leaveGroup, getAllGroupMembers, deleteGroupById } = require("../controllers/groupController");
const protect = require("../middlewares/protect");
const router = Router();

router.use(protect)

router.route("/").get(getAllGroups).post(createGroup);
router.route("/categories").get(getAllGroupsCategories);
router.route("/:groupId/ask-to-join/:userId").post(askToJoin);
router.route("/:groupId/accept/:userId").post(acceptRequest);
router.route("/:groupId/refuse/:userId").patch(refuseRequest);
router.route("/:groupId/leave/:userId").delete(leaveGroup);
router.route("/:groupId/members").get(getAllGroupMembers);
router.route("/:groupId").get(getGroupById);
router.route("/:groupId").delete(deleteGroupById);

module.exports = router;