const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware');

const {
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
} = require('../controllers/adminController');

// All routes are protected and require admin role
router.use(protect, admin);

router.get('/stats', asyncHandler(getDashboardStats));

router.get('/users', asyncHandler(getAllUsers));
router.put('/users/:id/promote', asyncHandler(promoteUser));
router.put('/users/:id/ban', asyncHandler(banUser));
router.put('/users/:id/credits', asyncHandler(updateUserCredits));
router.delete('/users/:id', asyncHandler(deleteUser));

router.get('/projects', asyncHandler(getAllProjects));
router.delete('/projects/:id', asyncHandler(deleteProject));

router.get('/reports', asyncHandler(getReports));
router.put('/reports/:id/resolve', asyncHandler(resolveReport));

router.get('/settings', asyncHandler(getSettings));
router.put('/settings', asyncHandler(updateSettings));

router.get('/disputes', asyncHandler(getDisputes));
router.put('/disputes/:id/resolve', asyncHandler(resolveDispute));

router.get('/activity', asyncHandler(getActivityLogs));

module.exports = router;
