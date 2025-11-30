const { Router } = require("express");
const { getNotifications, readNorifiaction, markSingleNotificationAsRead, markAllNotificationsAsRead } = require("../controllers/notificationController");
const protect = require("../middlewares/protect");
const router = Router();

router.use(protect)

router.route("/").get(getNotifications);
router.route("/isRead").patch(readNorifiaction);
router.route("/all/mark-read").patch(markAllNotificationsAsRead);
router.route("/:notificationId/mark-read").patch(markSingleNotificationAsRead);

module.exports = router;