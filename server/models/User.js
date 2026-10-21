const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth
    googleId: { type: String },
    role: { type: String, required: true, enum: ['freelancer', 'employer', 'admin'] },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    experience: { type: String, default: '' },
    upiId: { type: String, default: '' },
    phone: { type: String, default: '' },
    aadhaarLast4: { type: String, default: '' },
    referralCode: { type: String, unique: true },
    credits: { type: Number, default: 0 },
    referralCredits: { type: Number, default: 0 },
    freePostings: { type: Number, default: 0 },
    freeBids: { type: Number, default: 0 },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isAadhaarVerified: { type: Boolean, default: false },
    badge: { type: String, enum: ['Pro', 'Expert', ''], default: '' },
    badgeSubscriptionEnd: { type: Date },
    processedPayments: { type: [String], default: [] },
    referredByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
