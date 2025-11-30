// routes/message.routes.js
const { Router } = require("express");
const { 
  sendMessage, 
  getGroupMessages, 
  markMessagesAsRead,
  deleteMessage 
} = require("../controllers/messageController");
const protect = require("../middlewares/protect");

const router = Router();

router.use(protect);

// Send a message to a group
router.post("/:groupId/send", sendMessage);

// Get all messages in a group (with pagination)
router.get("/:groupId", getGroupMessages);

// Mark messages as read
router.patch("/:groupId/read", markMessagesAsRead);

// Delete a message
router.delete("/:messageId", deleteMessage);

module.exports = router;