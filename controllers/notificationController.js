const Notification = require("../models/notificationModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// GET all notifications for the logged-in user
const getNotifications = catchAsync(async (req, res, next) => {
  // console.log("getNotifications");
  // console.log(req.user._id);
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  // filter unread notifications
  const unreadNotifications = notifications.filter(notification => !notification.isRead);
  // console.log("unreadNotifications: ", unreadNotifications);
  // console.log("notifications: ", notifications);
  res.status(200).json({
    status: "success",
    results: unreadNotifications.length,
    data: {
      notifications: notifications,
    },
  });
});

const readNorifiaction = catchAsync(async (req, res, next) => {
  try {
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    console.log("req.user._id: ", req.user._id); // 6834a50be4cd02d5a57ba23b

    res.status(200).json({
      status: "success",
      data: {
        updatedCount: result.modifiedCount
      },
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error marking notifications as read", 500));
  }
});

const markSingleNotificationAsRead = catchAsync(async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    console.log("notificationId: ", notificationId); // 6835ce86d74d1fd4e0761e97
    console.log("req.user._id: ", req.user._id); // 6835a1f9340f7d72dfb30b46

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: req.user._id
      },
      {
        $set: { isRead: true }
      },
      { new: true }
    );

    console.log("notification: ", notification);

    if (!notification) {
      return next(new AppError("Notification not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        notification
      },
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error marking notification as read", 500));
  }
});

const markAllNotificationsAsRead = catchAsync(async (req, res, next) => {
  try {
    // const updatedNotification = await Notification.updateMany(
    //   {
    //     recipient: req.user._id,
    //     isRead: false
    //   },
    //   {
    //     $set: { isRead: true }
    //   }
    // );

    const notif = await Notification.find({ recipient: req.user._id });

    console.log("notif: ", notif);

    // console.log("updatedNotification: ", updatedNotification); // { acknowledged: true, modifiedCount: 2, upsertedId: null, upsertedCount: 0, matchedCount: 2 } 

    // res.status(200).json({
    //   status: "success",
    //   data: {
    //     updatedCount: updatedNotification.modifiedCount
    //   },
    //   message: "Toutes les notifications marquées comme lues avec succès."
    // })
  } catch (error) {
    console.error(error);
    next(error);
  }
})

module.exports = {
  getNotifications,
  readNorifiaction,
  markSingleNotificationAsRead,
  markAllNotificationsAsRead
};
