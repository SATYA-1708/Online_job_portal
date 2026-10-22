const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', protect, asyncHandler(getMyNotifications));
router.patch('/read-all', protect, asyncHandler(markAllAsRead));
router.patch('/:id/read', protect, asyncHandler(markAsRead));

module.exports = router;
