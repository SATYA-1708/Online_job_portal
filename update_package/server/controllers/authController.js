const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const Razorpay = require('razorpay');

const { users, referrals, settings, otps } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');
const sendEmail = require('../utils/emailService');


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Generate a unique referral code like REF-A3K9X2
const generateReferralCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
};

// Multer config for profile images
const profileUploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profileUploadsDir)) fs.mkdirSync(profileUploadsDir, { recursive: true });

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, profileUploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Email helper to normalize emails to lowercase
const normalizeEmail = (email) => (email ? email.trim().toLowerCase() : '');

const registerUser = async (req, res) => {
    const { name, password, role, referredBy, otp } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    // Role validation check to prevent privilege escalation
    if (!['freelancer', 'employer'].includes(role.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid role provided' });
    }
    const safeRole = role.toLowerCase();

    const userExists = await users.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // [PRODUCTION OTP CHECK]
    if (process.env.NODE_ENV === 'production' || true) { // Always enable for now as requested
        const validOtp = await otps.findOne({ email, otp, type: 'registration' });
        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        // Cleanup OTP once used
        await otps.deleteOne({ _id: validOtp._id });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a unique referral code for the new user
    let referralCode;
    let codeExists = true;
    while (codeExists) {
        referralCode = generateReferralCode();
        codeExists = await users.findOne({ referralCode });
    }

    const siteSettings = await settings.findOne() || {};
    const defaultCredits = siteSettings.defaultNewUserCredits !== undefined ? siteSettings.defaultNewUserCredits : 3;

    const userData = {
        name,
        email,
        password: hashedPassword,
        role,
        phone: req.body.phone || '',
        referralCode,
        credits: defaultCredits,          // new users start with dynamic free credits
        referralCredits: 0,
        freePostings: 0,
        freeBids: 0,
        isPhoneVerified: false,
        isEmailVerified: false,
        isAadhaarVerified: false,
    };

    // If referred by someone, store the referrer's user ID
    let referrerUser = null;
    if (referredBy) {
        referrerUser = await users.findOne({ referralCode: referredBy.toUpperCase() });
        if (referrerUser) {
            userData.referredByUserId = referrerUser._id;
        }
    }

    const user = await users.create(userData);

    if (user) {
        // Create referral record if valid referrer
        if (referrerUser) {
            await referrals.create({
                referrerId: referrerUser._id,
                referrerName: referrerUser.name,
                referredUserId: user._id,
                referredUserName: user.name,
                status: 'pending', // pending → rewarded
                createdAt: new Date(),
            });
            await logActivity(user._id, user.name, safeRole, 'registered', `New user registered via referral from ${referrerUser.name}`);
        } else {
            await logActivity(user._id, user.name, safeRole, 'registered', 'New user registered');
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: safeRole,
            referralCode: user.referralCode,
            credits: user.credits,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const loginUser = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    // [DEV ONLY] Mock Login Bypass for testing when DB is disconnected
    if (process.env.NODE_ENV !== 'production' && email === 'test@example.com') {
        console.log('[DEV] Using mock login bypass for test@example.com');
        return res.json({
            _id: '65d6c8e39f3a2b0012345678', // Realistic valid ObjectId format
            name: 'Test Admin',
            email: 'test@example.com',
            role: 'admin',
            bio: 'This is a mock account for UI testing.',
            skills: ['React', 'Node.js', 'Testing'],
            hourlyRate: 500,
            badge: 'Expert',
            credits: 99,
            isAadhaarVerified: true,
            isEmailVerified: true,
            token: generateToken('65d6c8e39f3a2b0012345678'),
        });
    }

    const user = await users.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Check if user is banned
        if (user.status === 'banned') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio,
            skills: user.skills,
            hourlyRate: user.hourlyRate,
            avatar: user.avatar,
            coverImage: user.coverImage,
            badge: user.badge,
            referralCode: user.referralCode,
            credits: user.credits ?? 0,
            referralCredits: user.referralCredits ?? 0,
            freePostings: user.freePostings ?? 0,
            freeBids: user.freeBids ?? 0,
            isPhoneVerified: user.isPhoneVerified ?? false,
            isEmailVerified: user.isEmailVerified ?? false,
            isAadhaarVerified: user.isAadhaarVerified ?? false,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

const getMe = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized (GETME)" });
    res.status(200).json(req.user);
}

const updateProfile = async (req, res) => {
    const user = await users.findOne({ _id: req.user._id });

    if (user) {
        const emailToUpdate = normalizeEmail(req.body.email) || user.email;

        // Check for email uniqueness if email is changing
        if (emailToUpdate !== user.email) {
            const emailExists = await users.findOne({ email: emailToUpdate });
            if (emailExists && emailExists._id !== user._id) {
                return res.status(400).json({ message: 'Email is already in use by another account' });
            }
        }

        const updatedUser = {
            ...user,
            name: req.body.name || user.name,
            email: emailToUpdate,
            bio: req.body.bio !== undefined ? req.body.bio : user.bio,
            skills: req.body.skills !== undefined ? req.body.skills : user.skills, // Fix falsy array override
            hourlyRate: req.body.hourlyRate !== undefined ? req.body.hourlyRate : user.hourlyRate, // Fix falsy 0 override
            experience: req.body.experience !== undefined ? req.body.experience : user.experience,
            upiId: req.body.upiId !== undefined ? req.body.upiId : user.upiId,
            phone: req.body.phone !== undefined ? req.body.phone : user.phone,
            aadhaarLast4: req.body.aadhaarLast4 !== undefined ? req.body.aadhaarLast4 : user.aadhaarLast4,
            isPhoneVerified: (req.body.phone && req.body.phone !== user.phone) ? false : (user.isPhoneVerified || false),
            isEmailVerified: (emailToUpdate && emailToUpdate !== user.email) ? false : (user.isEmailVerified || false),
            isAadhaarVerified: (req.body.aadhaarLast4 && req.body.aadhaarLast4 !== user.aadhaarLast4) ? false : (user.isAadhaarVerified || false),
        };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updatedUser.password = await bcrypt.hash(req.body.password, salt);
        }

        // Remove _id to prevent Mongoose error when updating
        delete updatedUser._id;
        await users.updateOne({ _id: user._id }, { $set: updatedUser });

        const { password, ...userWithoutPassword } = { ...user.toObject(), ...updatedUser };
        res.json({
            ...userWithoutPassword,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const getProfileById = async (req, res) => {
    const user = await users.findOne({ _id: req.params.id });
    if (user) {
        // CRITICAL FIX: Only return public PII-safe fields
        const safeProfile = {
            _id: user._id,
            name: user.name,
            role: user.role,
            bio: user.bio,
            skills: user.skills,
            hourlyRate: user.hourlyRate,
            experience: user.experience,
            avatar: user.avatar,
            coverImage: user.coverImage,
            badge: user.badge,
            qrImage: user.qrImage,
            upiId: user.upiId,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            isAadhaarVerified: user.isAadhaarVerified
        };
        res.json(safeProfile);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const avatarUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatar = avatarUrl;
        await users.updateOne({ _id: user._id }, { $set: { avatar: avatarUrl } });
        res.json({ avatar: avatarUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'New password is required' });

        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await users.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- NEW OTP & FORGOT PASSWORD HANDLERS ---

const sendOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { type } = req.body; // 'registration' or 'password_reset'

        if (!email) return res.status(400).json({ message: 'Email is required' });

        if (type === 'registration') {
            const userExists = await users.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'User already exists' });
        } else if (type === 'password_reset') {
            const userExists = await users.findOne({ email });
            if (!userExists) return res.status(404).json({ message: 'No user found with this email' });
        } else {
            return res.status(400).json({ message: 'Invalid OTP type' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in DB (upsert)
        await otps.updateOne(
            { email, type },
            { $set: { otp, createdAt: new Date() } },
            { upsert: true }
        );

        // Send Email
        const subject = type === 'registration' ? 'Email Verification OTP' : 'Password Reset OTP';
        const message = `Your OTP is: ${otp}. It will expire in 10 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">TECHSPARKX</h2>
                <p>Hello,</p>
                <p>You requested an OTP for <strong>${type === 'registration' ? 'registration' : 'password reset'}</strong>.</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
                </div>
                <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 TECHSPARKX. All rights reserved.</p>
            </div>
        `;

        await sendEmail({ email, subject, message, html });

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Send OTP Error:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }
};

const resetPasswordWithOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide email, otp, and new password' });
        }

        const validOtp = await otps.findOne({ email, otp, type: 'password_reset' });
        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await users.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await users.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        await otps.deleteOne({ _id: validOtp._id });

        res.status(200).json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: err.message });
    }
};

const uploadCover = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const coverUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.coverImage = coverUrl;
        await users.updateOne({ _id: user._id }, { $set: { coverImage: coverUrl } });
        res.json({ coverImage: coverUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const uploadQr = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const qrUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.qrImage = qrUrl;
        await users.updateOne({ _id: user._id }, { $set: { qrImage: qrUrl } });
        res.json({ qrImage: qrUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const BADGE_PLANS = {
    'Pro': { price: 99, label: 'Pro Badge' },
    'Expert': { price: 199, label: 'Expert Badge' },
};

const createBadgeOrder = async (req, res) => {
    try {
        const { badgeType } = req.body;
        const plan = BADGE_PLANS[badgeType];
        if (!plan) return res.status(400).json({ message: 'Invalid badge type' });

        const order = await razorpay.orders.create({
            amount: plan.price * 100,
            currency: 'INR',
            receipt: `b_${Date.now()}`,
            notes: { userId: req.user._id.toString(), badgeType },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            badgeType,
            badgeLabel: plan.label,
        });
    } catch (err) {
        console.error('Badge order error:', err);
        // Log more details if available
        if (err.error) console.error('Razorpay API Error Details:', JSON.stringify(err.error, null, 2));
        res.status(500).json({ message: 'Could not create payment order.' });
    }
};

const verifyBadgePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, badgeType } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !badgeType) {
            return res.status(400).json({ message: 'Missing payment details' });
        }

        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const subscriptionEnd = new Date();
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

        const updateResult = await users.updateOne(
            { _id: user._id, processedPayments: { $ne: razorpay_payment_id } },
            {
                $set: { badge: badgeType, badgeSubscriptionEnd: subscriptionEnd },
                $push: { processedPayments: razorpay_payment_id }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'Payment already processed' });
        }

        const updated = await users.findOne({ _id: user._id });
        const { password, ...userWithoutPassword } = updated.toObject();

        res.json({
            ...userWithoutPassword,
            token: generateToken(updated._id),
            message: `✅ Successfully upgraded to ${badgeType}!`,
        });
    } catch (err) {
        console.error('Badge verification error:', err);
        res.status(500).json({ message: err.message });
    }
};

const purchaseBadge = async (req, res) => {
    res.status(403).json({ message: 'Mock payments are disabled. Please use the real Razorpay flow.' });
};

const getReferralInfo = async (req, res) => {
    try {
        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const myReferrals = await referrals.find({ referrerId: user._id }).sort({ createdAt: -1 });

        const totalRewarded = myReferrals.filter(r => r.status === 'rewarded').length;

        res.json({
            referralCode: user.referralCode,
            referralCredits: user.referralCredits || 0,
            freePostings: user.freePostings || 0,
            freeBids: user.freeBids || 0,
            totalRewarded,
            referrals: myReferrals.map(r => ({
                _id: r._id,
                referredUserName: r.referredUserName,
                status: r.status,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const claimReferralCredit = async (req, res) => {
    try {
        const { type } = req.body; // 'posting' or 'bid'
        if (type !== 'posting' && type !== 'bid') {
            return res.status(400).json({ message: 'Type must be "posting" or "bid"' });
        }

        const field = type === 'posting' ? 'freePostings' : 'freeBids';

        // TOCTOU Fix: Atomically check and deduct referral credits
        const updateResult = await users.updateOne(
            { _id: req.user._id, referralCredits: { $gt: 0 } },
            { $inc: { referralCredits: -1, [field]: 1 } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'No referral credits available' });
        }

        const updated = await users.findOne({ _id: req.user._id });
        res.json({
            message: `Credit redeemed! You now have 1 free ${type === 'posting' ? 'project posting' : 'bid'}.`,
            referralCredits: updated.referralCredits,
            freePostings: updated.freePostings,
            freeBids: updated.freeBids,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const googleAuth = async (req, res) => {
    try {
        const { credential, role, referredBy } = req.body;
        if (!credential) return res.status(400).json({ message: 'Google credential is required' });

        // Verify token with Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return res.status(401).json({ message: 'Invalid Google token' });

        const { sub: googleId, email, name, picture } = payload;

        // Check if user already exists
        let user = await users.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Existing user — update googleId and avatar if missing
            if (!user.googleId || !user.avatar) {
                await users.updateOne(
                    { _id: user._id },
                    { $set: { googleId, avatar: user.avatar || picture || '' } }
                );
                user = await users.findOne({ _id: user._id });
            }
        } else {
            // New user — require role from frontend
            if (!role || !['freelancer', 'employer'].includes(role)) {
                return res.status(202).json({ needsRole: true, email, name, picture, googleId });
            }

            // Generate unique referral code
            let referralCode;
            let codeExists = true;
            while (codeExists) {
                referralCode = generateReferralCode();
                codeExists = await users.findOne({ referralCode });
            }

            const siteSettings = await settings.findOne() || {};
            const defaultCredits = siteSettings.defaultNewUserCredits !== undefined ? siteSettings.defaultNewUserCredits : 3;

            const userData = {
                name,
                email,
                password: '', // no password for Google users
                googleId,
                role,
                avatar: picture || '',
                referralCode,
                credits: defaultCredits,          // new users start with dynamic free credits
                referralCredits: 0,
                freePostings: 0,
                freeBids: 0,
                isPhoneVerified: false,
                isEmailVerified: true, // Google verifies email
                isAadhaarVerified: false,
            };

            // Handle referral
            let referrerUser = null;
            if (referredBy) {
                referrerUser = await users.findOne({ referralCode: referredBy.toUpperCase() });
                if (referrerUser) userData.referredByUserId = referrerUser._id;
            }

            user = await users.create(userData);

            if (referrerUser) {
                await referrals.create({
                    referrerId: referrerUser._id,
                    referrerName: referrerUser.name,
                    referredUserId: user._id,
                    referredUserName: user.name,
                    status: 'pending',
                    createdAt: new Date(),
                });
                await logActivity(user._id, user.name, role, 'registered', `New user registered with Google via referral from ${referrerUser.name}`);
            } else {
                await logActivity(user._id, user.name, role, 'registered', 'New user registered with Google');
            }
        }

        if (user && typeof user.toObject === 'function') {
            user = user.toObject();
        }
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({
            ...userWithoutPassword,
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};

const CREDIT_PACKS = {
    credits_5: { amount: 5, price: 49, label: '5 Credits' },
    credits_15: { amount: 15, price: 99, label: '15 Credits' },
    credits_30: { amount: 30, price: 179, label: '30 Credits' },
};

const purchaseCredits = async (req, res) => {
    try {
        const { pack } = req.body;
        const packInfo = CREDIT_PACKS[pack];
        if (!packInfo) return res.status(400).json({ message: 'Invalid credit pack' });

        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // [SECURITY FIX] Disable mock credit minting for production
        console.warn(`[SECURITY] User ${req.user._id} attempted to use the disabled mock credit minting endpoint for pack ${pack}.`);
        return res.status(403).json({ message: 'Direct credit minting is disabled in production. Please complete the Razorpay payment flow.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createCreditOrder = async (req, res) => {
    try {
        const { pack } = req.body;
        const packInfo = CREDIT_PACKS[pack];
        if (!packInfo) return res.status(400).json({ message: 'Invalid credit pack' });

        const order = await razorpay.orders.create({
            amount: packInfo.price * 100, // Razorpay expects amount in paise (₹1 = 100 paise)
            currency: 'INR',
            receipt: `c_${Date.now()}`,
            notes: { userId: req.user._id.toString(), pack },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            pack,
            packLabel: packInfo.label,
        });
    } catch (err) {
        console.error('Razorpay order error:', err);
        // Log more details if available
        if (err.error) console.error('Razorpay API Error Details:', JSON.stringify(err.error, null, 2));
        res.status(500).json({ message: 'Could not create payment order. Check Razorpay API keys.' });
    }
};

const verifyCreditPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !pack) {
            return res.status(400).json({ message: 'Missing payment details' });
        }

        // Verify HMAC-SHA256 signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
        }

        // Signature valid — add credits
        const packInfo = CREDIT_PACKS[pack];
        if (!packInfo) return res.status(400).json({ message: 'Invalid credit pack' });

        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent Replay Attacks & Data Races: Atomic update with credit increment
        const updateResult = await users.updateOne(
            { _id: user._id, processedPayments: { $ne: razorpay_payment_id } },
            {
                $inc: { credits: packInfo.amount },
                $push: { processedPayments: razorpay_payment_id }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'This payment has already been processed.' });
        }

        const updated = await users.findOne({ _id: user._id });
        const { password, ...userWithoutPassword } = updated.toObject();

        res.json({
            ...userWithoutPassword,
            token: generateToken(updated._id),
            message: `✅ ${packInfo.amount} credits added successfully!`,
        });
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    getProfileById,
    uploadAvatar,
    uploadCover,
    uploadQr,
    profileUpload,
    purchaseBadge,
    createBadgeOrder,
    verifyBadgePayment,
    getReferralInfo,
    claimReferralCredit,
    googleAuth,
    purchaseCredits,
    CREDIT_PACKS,
    createCreditOrder,
    verifyCreditPayment,
    sendOTP,
    resetPasswordWithOTP,
};
