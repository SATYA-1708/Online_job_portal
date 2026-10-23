const { activityLogs } = require('../models/db');

/**
 * Global helper to log significant actions across the platform.
 * 
 * @param {string} userId   - ID of the user performing the action
 * @param {string} userName - Name of the user performing the action
 * @param {string} userRole - 'admin', 'freelancer', or 'employer'
 * @param {string} action   - A short string literal (e.g., 'registered', 'created_project', 'banned_user')
 * @param {string} details  - Human readable explanation of the action
 * @param {string} targetId - (Optional) The ID of the affected resource (project, user, etc)
 */
const logActivity = async (userId, userName, userRole, action, details = '', targetId = null) => {
    try {
        await activityLogs.create({
            userId,
            userName,
            userRole,
            action,
            details,
            targetId
        });
    } catch (err) {
        console.error('Failed to log global activity:', err);
    }
};

module.exports = { logActivity };
