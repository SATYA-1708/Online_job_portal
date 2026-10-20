const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporterName: { type: String, required: true },
    reportedType: { type: String, enum: ['user', 'project', 'message'], required: true },
    reportedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' },
    adminAction: { type: String }, // e.g., 'warned', 'suspended', 'deleted'
    resolvedAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
