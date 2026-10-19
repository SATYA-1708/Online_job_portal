const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: 'user' },
    action: { type: String, required: true }, // e.g., 'registered', 'posted_project', 'awarded_contract'
    details: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId }
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
