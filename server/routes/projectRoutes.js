const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { createProject, getProjects, getProjectById, placeBid, getMyProjectBids, getMyProjects } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', asyncHandler(getProjects));
router.get('/my', protect, asyncHandler(getMyProjects));
router.post('/', protect, asyncHandler(createProject));
router.get('/:id', asyncHandler(getProjectById));
router.post('/:id/bid', protect, asyncHandler(placeBid));
router.get('/:id/bids', protect, asyncHandler(getMyProjectBids));

module.exports = router;
