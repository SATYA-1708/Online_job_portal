const { users, projects, contracts, reports, activityLogs, settings } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');


/**
 * GET /api/admin/stats
 * Overview numbers for the admin dashboard
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await users.countDocuments().maxTimeMS(2000);

        // New users today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const newUsers = await users.countDocuments({ createdAt: { $gte: startOfDay } }).maxTimeMS(2000);

        const totalProjects = await projects.countDocuments().maxTimeMS(2000);
        const activeProjects = await projects.countDocuments({ status: 'open' }).maxTimeMS(2000);
        const completedProjects = await contracts.countDocuments({ status: 'completed' }).maxTimeMS(2000);

        const pendingReports = await reports.countDocuments({ status: 'pending' }).maxTimeMS(2000);

        res.json({
            totalUsers,
            newUsers,
            totalProjects,
            activeProjects,
            completedProjects,
            pendingReports
        });
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[PROD] Database error during getDashboardStats:', err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        console.log('[DEV] Database timeout, returning mock stats');
        res.json({
            totalUsers: 156,
            newUsers: 5,
            totalProjects: 42,
            activeProjects: 28,
            completedProjects: 12,
            pendingReports: 3
        });
    }
};

/**
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    // Exclude passwords
    const allUsers = await users.find().select('-password').sort({ createdAt: -1 });
    res.json(allUsers);
};

/**
 * PUT /api/admin/users/:id/ban
 */
const banUser = async (req, res) => {
    const user = await users.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Toggle ban status
    const newStatus = user.status === 'banned' ? 'active' : 'banned';

    await users.updateOne({ _id: user._id }, { $set: { status: newStatus } });

    await logActivity(
        req.user._id, req.user.name, req.user.role,
        newStatus === 'banned' ? 'banned_user' : 'unbanned_user',
        `User ${user.email} was ${newStatus}`,
        user._id
    );

    res.json({ message: `User ${user.name} has been ${newStatus}.` });
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
    const user = await users.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete an admin account.' });
    }

    await users.deleteOne({ _id: user._id });

    await logActivity(req.user._id, req.user.name, req.user.role, 'deleted_user', `Deleted user account: ${user.email}`, user._id);

    res.json({ message: 'User permanently deleted.' });
};

/**
 * PUT /api/admin/users/:id/promote
 */
const promoteUser = async (req, res) => {
    const user = await users.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
        return res.status(400).json({ message: 'User is already an admin.' });
    }

    await users.updateOne({ _id: user._id }, { $set: { role: 'admin' } });

    await logActivity(
        req.user._id, req.user.name, req.user.role,
        'promoted_admin',
        `User ${user.email} was promoted to admin`,
        user._id
    );

    res.json({ message: `User ${user.name} has been promoted to admin.` });
};

/**
 * GET /api/admin/projects
 */
const getAllProjects = async (req, res) => {
    // Redact bids array for faster transport if needed, or keep for admin review
    const allProjects = await projects.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(allProjects);
};

/**
 * DELETE /api/admin/projects/:id
 */
const deleteProject = async (req, res) => {
    const project = await projects.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await projects.deleteOne({ _id: project._id });

    await logActivity(req.user._id, req.user.name, req.user.role, 'deleted_project', `Deleted project: ${project.title}`, project._id);

    res.json({ message: 'Project removed.' });
};

/**
 * GET /api/admin/reports
 */
const getReports = async (req, res) => {
    const allReports = await reports.find().sort({ createdAt: -1 });
    res.json(allReports);
};

/**
 * PUT /api/admin/reports/:id/resolve
 * Body: { action: 'warned' | 'suspended' | 'deleted' | 'ignored' }
 */
const resolveReport = async (req, res) => {
    const { action } = req.body;
    const report = await reports.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = action === 'ignored' ? 'ignored' : 'resolved';
    report.adminAction = action;
    report.resolvedAt = new Date();
    await report.save();

    if (action === 'warned') {
        const { pushNotification } = require('../utils/notificationPusher');
        await pushNotification(
            report.reportedId,
            'warning',
            'Platform Warning',
            'You have received a warning regarding your activity. Please ensure you follow our community guidelines.',
            '/'
        );
    } else if (action === 'suspended' && report.reportedType === 'user') {
        await users.updateOne({ _id: report.reportedId }, { $set: { status: 'banned' } });
    } else if (action === 'deleted') {
        if (report.reportedType === 'project') {
            await projects.deleteOne({ _id: report.reportedId });
        } else if (report.reportedType === 'message') {
            const { messages } = require('../models/db');
            await messages.deleteOne({ _id: report.reportedId });
        }
    }

    await logActivity(req.user._id, req.user.name, req.user.role, 'resolved_report', `Resolved report against ${report.reportedType} ID ${report.reportedId} with action: ${action}`, report._id);

    res.json(report);
};

/**
 * GET /api/admin/settings
 */
const getSettings = async (req, res) => {
    let siteSettings = await settings.findOne();
    if (!siteSettings) {
        siteSettings = await settings.create({}); // Generate default if missing
    }
    res.json(siteSettings);
};

/**
 * PUT /api/admin/settings
 */
const updateSettings = async (req, res) => {
    let siteSettings = await settings.findOne();
    if (!siteSettings) {
        siteSettings = new settings(req.body);
    } else {
        Object.assign(siteSettings, req.body);
    }
    await siteSettings.save();

    await logActivity(req.user._id, req.user.name, req.user.role, 'updated_settings', 'Global platform settings were updated');

    res.json(siteSettings);
};

/**
 * GET /api/admin/activity
 */
const getActivityLogs = async (req, res) => {
    const logs = await activityLogs.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
};

/**
 * GET /api/admin/disputes
 */
const getDisputes = async (req, res) => {
    const disputedContracts = await contracts.find({ status: 'disputed' }).sort({ updatedAt: -1 });
    res.json(disputedContracts);
};

/**
 * PUT /api/admin/disputes/:id/resolve
 */
const resolveDispute = async (req, res) => {
    const { outcome } = req.body;
    const contract = await contracts.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.status !== 'disputed') {
        return res.status(400).json({ message: 'This contract is not currently disputed.' });
    }

    if (outcome === 'refund_employer') {
        contract.status = 'cancelled';
    } else if (outcome === 'pay_freelancer') {
        contract.status = 'completed';
        contract.milestones.forEach(m => {
            if (m.status !== 'confirmed') {
                m.status = 'confirmed';
                m.confirmedAt = new Date();
            }
        });
    } else {
        return res.status(400).json({ message: 'Invalid outcome' });
    }

    await contract.save();
    await logActivity(req.user._id, req.user.name, req.user.role, 'resolved_dispute', `Resolved dispute for contract ${contract._id} with outcome: ${outcome}`, contract._id);

    const { pushNotification } = require('../utils/notificationPusher');
    await pushNotification(
        contract.employerId,
        'info',
        'Dispute Resolved',
        `An admin has resolved the dispute for "${contract.projectTitle}". The contract is now ${contract.status}.`,
        '/contract'
    );
    await pushNotification(
        contract.freelancerId,
        'info',
        'Dispute Resolved',
        `An admin has resolved the dispute for "${contract.projectTitle}". The contract is now ${contract.status}.`,
        '/contract'
    );

    res.json(contract);
};

/**
 * PUT /api/admin/users/:id/credits
 * Body: { credits, referralCredits, freePostings, freeBids }
 */
const updateUserCredits = async (req, res) => {
    const { credits, referralCredits, freePostings, freeBids } = req.body;
    const user = await users.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const update = {};
    if (credits !== undefined) update.credits = credits;
    if (referralCredits !== undefined) update.referralCredits = referralCredits;
    if (freePostings !== undefined) update.freePostings = freePostings;
    if (freeBids !== undefined) update.freeBids = freeBids;

    await users.updateOne({ _id: user._id }, { $set: update });

    await logActivity(
        req.user._id, req.user.name, req.user.role,
        'updated_user_credits',
        `Updated credits for user ${user.email}: ${JSON.stringify(update)}`,
        user._id
    );

    res.json({ message: `Credits for ${user.name} have been updated.` });
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    promoteUser,
    banUser,
    deleteUser,
    getAllProjects,
    deleteProject,
    getReports,
    resolveReport,
    getSettings,
    updateSettings,
    getActivityLogs,
    getDisputes,
    resolveDispute,
    updateUserCredits
};
