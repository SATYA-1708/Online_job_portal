const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referrerName: { type: String, required: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referredUserName: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, rewarded
    rewardType: { type: String }, // e.g., 'credit'
    rewardedAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Referral', referralSchema);
