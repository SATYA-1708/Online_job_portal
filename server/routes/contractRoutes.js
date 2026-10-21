const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const {
    createContract,
    getMyContracts,
    getContractById,
    confirmTaskDone,
    markMilestonePaid,
    confirmMilestoneReceived,
    raiseDispute,
    proofUpload,
} = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, asyncHandler(createContract));
router.get('/', protect, asyncHandler(getMyContracts));
router.get('/:id', protect, asyncHandler(getContractById));
router.patch('/:id/milestone/:milestoneIndex/task-done', protect, asyncHandler(confirmTaskDone));
router.patch('/:id/milestone/:milestoneIndex/paid', protect, proofUpload.single('proofImage'), asyncHandler(markMilestonePaid));
router.patch('/:id/milestone/:milestoneIndex/confirm', protect, asyncHandler(confirmMilestoneReceived));
router.patch('/:id/dispute', protect, asyncHandler(raiseDispute));

module.exports = router;
