const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userBadge: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    bids: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        amount: Number,
        proposal: String,
        createdAt: { type: Date, default: Date.now }
    }],
    status: { type: String, default: 'open' }, // open, awarded
    awardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    awardedToName: { type: String },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
