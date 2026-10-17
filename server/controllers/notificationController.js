const { notifications } = require('../models/db');

/**
 * GET /api/notifications
 * Get all notifications for the logged-in user, sorted by newest first.
 * Accepts optional query `unread=true` to fetch only unread notifications.
 */
const getMyNotifications = async (req, res) => {
    try {
        const query = { userId: req.user._id };
        if (req.query.unread === 'true') {
            query.read = false;
        }

        const userNotifications = await notifications.find(query).sort({ createdAt: -1 });
        res.status(200).json(userNotifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching notifications' });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await notifications.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating notification' });
    }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the logged in user as read.
 */
const markAllAsRead = async (req, res) => {
    try {
        await notifications.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating notifications' });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
