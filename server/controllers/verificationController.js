const { verificationRequests, users } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');
const asyncHandler = require('express-async-handler');

// @desc    Submit a new verification request
// @route   POST /api/verification
// @access  Private
const submitVerification = asyncHandler(async (req, res) => {
    const { documentType } = req.body;

    if (!documentType || !req.file) {
        res.status(400);
        throw new Error('Please provide document type and upload an image');
    }

    // Check if user already has a pending or approved request
    const existing = await verificationRequests.findOne({
        userId: req.user._id,
        status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
        res.status(400);
        throw new Error('You already have a pending or approved verification request');
    }

    const verification = await verificationRequests.create({
        userId: req.user._id,
        userName: req.user.name,
        documentType,
        documentImage: req.file.filename,
        status: 'pending'
    });

    await logActivity(req.user._id, req.user.name, req.user.role, 'submitted_kyc', `Submitted KYC document (${documentType})`);

    res.status(201).json(verification);
});

// @desc    Get all pending verification requests
// @route   GET /api/verification/pending
// @access  Private/Admin
const getPendingVerifications = asyncHandler(async (req, res) => {
    const requests = await verificationRequests.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(requests);
});

// @desc    Approve or reject a verification request
// @route   PUT /api/verification/:id/resolve
// @access  Private/Admin
const resolveVerification = asyncHandler(async (req, res) => {
    const { action, reason } = req.body; // action: 'approve' or 'reject'
    const request = await verificationRequests.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Verification request not found');
    }

    if (action === 'approve') {
        const user = await users.findById(request.userId);
        if (user) {
            user.isAadhaarVerified = true;
            await user.save();
        }

        request.status = 'approved';
        await request.save();

        await logActivity(req.user._id, req.user.name, req.user.role, 'approved_kyc', `Approved KYC for ${request.userName}`);
        res.json({ message: 'Request approved successfully', userVerified: true });
    } else if (action === 'reject') {
        request.status = 'rejected';
        request.rejectionReason = reason;
        await request.save();

        await logActivity(req.user._id, req.user.name, req.user.role, 'rejected_kyc', `Rejected KYC for ${request.userName}`, request.userId);
        res.json({ message: 'Request rejected successfully' });
    } else {
        res.status(400);
        throw new Error('Invalid action');
    }
});

module.exports = {
    submitVerification,
    getPendingVerifications,
    resolveVerification
};
