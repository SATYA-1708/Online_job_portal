const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const {
    registerUser, loginUser, getMe, updateProfile,
    getProfileById, uploadAvatar, uploadCover, uploadQr, profileUpload,
    purchaseBadge, createBadgeOrder, verifyBadgePayment,
    getReferralInfo, claimReferralCredit, googleAuth,
    purchaseCredits, createCreditOrder, verifyCreditPayment,
    sendOTP, resetPasswordWithOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.post('/google', asyncHandler(googleAuth));
router.get('/me', protect, asyncHandler(getMe));
router.put('/profile', protect, asyncHandler(updateProfile));
router.post('/upload-avatar', protect, profileUpload.single('avatar'), asyncHandler(uploadAvatar));
router.post('/upload-cover', protect, profileUpload.single('cover'), asyncHandler(uploadCover));
router.post('/upload-qr', protect, profileUpload.single('qr'), asyncHandler(uploadQr));
router.post('/create-badge-order', protect, asyncHandler(createBadgeOrder));
router.post('/verify-badge-payment', protect, asyncHandler(verifyBadgePayment));
router.post('/purchase-credits', protect, asyncHandler(purchaseCredits));       // mock (kept for fallback)
router.post('/create-credit-order', protect, asyncHandler(createCreditOrder));  // Razorpay: step 1 — create order
router.post('/verify-credit-payment', protect, asyncHandler(verifyCreditPayment)); // Razorpay: step 2 — verify & credit
router.get('/referral-info', protect, asyncHandler(getReferralInfo));
router.post('/claim-referral-credit', protect, asyncHandler(claimReferralCredit));
router.post('/send-otp', asyncHandler(sendOTP));
router.post('/reset-password-otp', asyncHandler(resetPasswordWithOTP));
router.get('/:id', asyncHandler(getProfileById));

module.exports = router;
