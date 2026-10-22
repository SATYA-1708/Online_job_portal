const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    submitVerification,
    getPendingVerifications,
    resolveVerification
} = require('../controllers/verificationController');

// Multer Config for KYC Document Uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `kyc-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Please upload an image file'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// User routes
router.post('/', protect, upload.single('documentImage'), submitVerification);

// Admin routes
router.get('/pending', protect, admin, getPendingVerifications);
router.put('/:id/resolve', protect, admin, resolveVerification);

module.exports = router;
