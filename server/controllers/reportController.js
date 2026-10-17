const { reports, activityLogs } = require('../models/db');

/**
 * @desc    Submit a new report
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = async (req, res) => {
    try {
        const { reportedId, reportedType, reason } = req.body;

        // Validation
        if (!reportedId || !reportedType || !reason) {
            return res.status(400).json({ message: 'All fields (reportedId, reportedType, reason) are required.' });
        }

        if (!['user', 'project', 'message'].includes(reportedType)) {
            return res.status(400).json({ message: 'Invalid entity type reported.' });
        }

        // Prevent users from reporting themselves
        if (reportedType === 'user' && reportedId === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot report yourself.' });
        }

        const newReport = await reports.create({
            reporterId: req.user._id,
            reporterName: req.user.name,
            reportedType,
            reportedId,
            reason,
            status: 'pending'
        });

        // Optionally, if we exceed a certain number of reports, we might create an ActivityLog
        // to alert admins immediately via dashboard feed, but for now just storing the report
        // is enough for the Admin /reports table

        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Server error while submitting report.' });
    }
};

module.exports = {
    createReport
};
