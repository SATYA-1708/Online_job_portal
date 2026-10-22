const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { submitReview, getReviewsForUser } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, asyncHandler(submitReview));
router.get('/:userId', asyncHandler(getReviewsForUser));

module.exports = router;
