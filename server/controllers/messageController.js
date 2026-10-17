const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { messages, users } = require('../models/db');

// Multer config
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|txt|csv|doc|docx/;
        const ext = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        const mimeMatches = /image|pdf|text|msword|officedocument/.test(file.mimetype);
        if (ext && mimeMatches) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

// Smart Privacy Filter
const containsContactInfo = (text) => {
    if (!text || typeof text !== 'string') return false;

    // Normalize string to ignore spaces and common obfuscation
    const normalized = text.toLowerCase().replace(/[\s\.\-\(\)]/g, '');

    // 1. Email detection (more aggressive)
    const emailRegex = /[a-z0-9_]+(at|@)[a-z0-9]+(dot|\.)[a-z]{2,}/i;

    // 2. Phone number detection (Aggressively target 10+ digits sequence in normalized string)
    const phoneRegex = /\d{10,}/;

    // 3. Social Media & External Links
    const socialRegex = /instagram|ig|telegram|whatsapp|wa\.me|discord|linkedin|facebook|snapchat/i;

    const hasEmail = emailRegex.test(normalized);
    const hasPhone = phoneRegex.test(normalized);
    const hasSocial = socialRegex.test(normalized);

    if (hasEmail || hasPhone || hasSocial) {
        console.log(`[FILTER TRIGGERED] - Email: ${hasEmail}, Phone: ${hasPhone}, Social: ${hasSocial}, Text: ${text}`);
        return true;
    }

    return false;
};

const sendMessage = async (req, res) => {
    console.log('sendMessage called. Body:', req.body, 'File:', req.file);
    const { receiverId, content } = req.body;

    if (!receiverId || (!content && !req.file)) {
        return res.status(400).json({ message: 'Please provide receiverId and content or a file' });
    }

    if (content && containsContactInfo(content)) {
        console.warn(`[SECURITY] Blocked message from user ${req.user._id}. Reason: Detected contact info.`);
        return res.status(400).json({
            message: 'Message blocked: Sharing external contact information (emails, phone numbers, or social media handles) is strictly prohibited on our platform for user safety.'
        });
    }

    const receiver = await users.findOne({ _id: receiverId });
    if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found' });
    }

    const msgData = {
        senderId: req.user._id,
        receiverId,
        content: content || '',
        createdAt: new Date(),
        read: false,
    };

    // If file was uploaded, attach file info
    if (req.file) {
        msgData.file = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        };
    }

    const message = await messages.create(msgData);
    res.status(201).json(message);
};

const getMessages = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await messages.find({
        $or: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
        ]
    }).sort({ createdAt: 1 });

    res.status(200).json(conversation);
};

const getConversations = async (req, res) => {
    const currentUserId = req.user._id.toString();

    const allMyMessages = await messages.find({
        $or: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
        ]
    });

    // Use a Set of string IDs to deduplicate partners (ObjectId !== won't work for object comparison)
    const partnerIdSet = new Set();
    allMyMessages.forEach(msg => {
        const senderId = msg.senderId?.toString();
        const receiverId = msg.receiverId?.toString();
        if (senderId && senderId !== currentUserId) partnerIdSet.add(senderId);
        if (receiverId && receiverId !== currentUserId) partnerIdSet.add(receiverId);
    });

    const conversationPartners = [];
    for (const id of partnerIdSet) {
        const partner = await users.findOne({ _id: id });
        if (partner) {
            conversationPartners.push({
                _id: partner._id,
                name: partner.name,
                email: partner.email,
                badge: partner.badge
            });
        }
    }

    res.status(200).json(conversationPartners);
}

module.exports = {
    sendMessage,
    getMessages,
    getConversations,
    upload
};
