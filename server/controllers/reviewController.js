const { reviews, contracts } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * POST /api/reviews
 * Body: { contractId, rating (1-5), comment }
 * Both employer and freelancer of a completed contract can submit a review for each other.
 */
const submitReview = async (req, res) => {
    const { contractId, rating, comment } = req.body;

    if (!contractId || !rating) {
        return res.status(400).json({ message: 'contractId and rating are required' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const contract = await contracts.findOne({ _id: contractId });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.status !== 'completed') {
        return res.status(400).json({ message: 'Can only review after all milestones are completed' });
    }

    const isEmployer = contract.employerId.toString() === req.user._id.toString();
    const isFreelancer = contract.freelancerId.toString() === req.user._id.toString();

    if (!isEmployer && !isFreelancer) {
        return res.status(403).json({ message: 'Only participants can submit a review' });
    }

    const revieweeId = isEmployer ? contract.freelancerId : contract.employerId;
    const revieweeName = isEmployer ? contract.freelancerName : contract.employerName;
    const fieldToCheck = isEmployer ? 'reviewedByEmployer' : 'reviewedByFreelancer';

    // [SECURITY] Atomic update to prevent a race condition allowing multiple review spam
    const updateResult = await contracts.updateOne(
        { _id: contractId, [fieldToCheck]: { $ne: true } },
        { $set: { [fieldToCheck]: true } }
    );

    if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ message: 'You have already reviewed this contract' });
    }

    const review = await reviews.create({
        contractId,
        projectId: contract.projectId,
        projectTitle: contract.projectTitle,
        reviewerId: req.user._id,
        reviewerName: req.user.name,
        revieweeId,
        revieweeName,
        amount: contract.amount,
        rating: numRating,
        comment: comment ? comment.trim() : '',
        createdAt: new Date(),
    });

    await logActivity(req.user._id, req.user.name, req.user.role, 'submitted_review', `Left a ${numRating}-star review for ${revieweeName}`, contract.projectId);

    const { pushNotification } = require('../utils/notificationPusher');
    await pushNotification(
        revieweeId,
        'info',
        'New Review Received',
        `${req.user.name} left you a ${numRating}-star review for "${contract.projectTitle}".`,
        `/profile/${revieweeId}`
    );

    res.status(201).json(review);
};

/**
 * GET /api/reviews/:userId
 * Public endpoint — returns all reviews for a user (as freelancer or employer), sorted newest first.
 */
const getReviewsForUser = async (req, res) => {
    const userId = req.params.userId;
    const userReviews = await reviews.find({ revieweeId: userId }).sort({ createdAt: -1 });
    res.status(200).json(userReviews);
};

module.exports = { submitReview, getReviewsForUser };
