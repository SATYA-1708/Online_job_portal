const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { sendMessage, getMessages, getConversations, upload } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, (req, res, next) => {
    // Check if the request is multipart (has file)
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
        upload.single('file')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: 'File upload error: ' + err.message });
            }
            next();
        });
    } else {
        // JSON request, no file - body already parsed by express.json()
        next();
    }
}, asyncHandler(sendMessage));

router.get('/conversations', protect, asyncHandler(getConversations));
router.get('/:userId', protect, asyncHandler(getMessages));

module.exports = router;
