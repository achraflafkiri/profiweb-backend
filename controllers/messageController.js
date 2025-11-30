// controllers/messageController.js
const catchAsync = require("../utils/catchAsync");
const Message = require("../models/messageModel");
const Group = require("../models/groupModel");
const AppError = require("../utils/AppError");

const sendMessage = catchAsync(async (req, res, next) => {
  console.log("===========sendMessage=============");
  const { content, messageType = 'text' } = req.body; // Added messageType for future media support
  const groupId = req.params.groupId;
  const senderId = req.user._id;

  console.log(senderId, "senderId");

  if (!content) return next(new AppError("Message content is required", 400));

  // Verify group exists and user is a member
  const group = await Group.findById(groupId).populate('members', 'firstName lastName');
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.members.some(member => member._id.toString() === senderId.toString())) {
    return next(new AppError("You are not a member of this group", 403));
  }

  // Create the message
  const message = await Message.create({
    content,
    messageType,
    sender: senderId,
    group: groupId,
  });

  console.log(message, "message");  

  // Re-fetch with sender populated
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstName lastName avatar")
    .populate("group", "name");

  // Update group's last message and timestamp
  await Group.findByIdAndUpdate(groupId, {
    lastMessage: message._id,
    lastActivity: new Date()
  });

  res.status(201).json({
    success: true,
    data: {
      message: populatedMessage,
    }
  });
});

const getGroupMessages = catchAsync(async (req, res, next) => {
  const groupId = req.params.groupId;
  const senderId = req.user._id;
  const { page = 1, limit = 50 } = req.query; // Add pagination

  // Check if user is member of the group
  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.members.includes(senderId)) {
    return next(new AppError("You are not a member of this group", 403));
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  const messages = await Message.find({ group: groupId })
    .populate("sender", "firstName lastName avatar")
    .sort({ createdAt: -1 }) // Sort by newest first for pagination
    .skip(skip)
    .limit(parseInt(limit));

  // Reverse to show oldest first
  messages.reverse();

  // Get total count for pagination info
  const totalMessages = await Message.countDocuments({ group: groupId });

  res.status(200).json({
    success: true,
    data: {
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      }
    }
  });
});

// Mark messages as read
const markMessagesAsRead = catchAsync(async (req, res, next) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;
  const { messageIds } = req.body;

  // Verify user is group member
  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.members.includes(userId)) {
    return next(new AppError("You are not a member of this group", 403));
  }

  // Update read status for messages
  await Message.updateMany(
    { 
      _id: { $in: messageIds }, 
      group: groupId,
      sender: { $ne: userId } // Don't mark own messages as read
    },
    { 
      $addToSet: { readBy: userId }
    }
  );

  res.status(200).json({
    success: true,
    message: "Messages marked as read"
  });
});

// Delete a message
const deleteMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId).populate('group');
  if (!message) return next(new AppError("Message not found", 404));

  // Check if user is the sender or group admin
  const group = await Group.findById(message.group._id);
  const isGroupAdmin = group.createdBy.toString() === userId.toString();
  const isMessageSender = message.sender.toString() === userId.toString();

  if (!isGroupAdmin && !isMessageSender) {
    return next(new AppError("You can only delete your own messages", 403));
  }

  // Soft delete - mark as deleted instead of removing
  message.isDeleted = true;
  message.deletedAt = new Date();
  message.deletedBy = userId;
  await message.save();

  res.status(200).json({
    success: true,
    message: "Message deleted successfully"
  });
});

module.exports = { 
  sendMessage, 
  getGroupMessages, 
  markMessagesAsRead,
  deleteMessage 
};