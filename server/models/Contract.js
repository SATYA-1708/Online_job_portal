const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    index: { type: Number, required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' }, // pending, paid, confirmed
    taskDoneByEmployer: { type: Boolean, default: false },
    taskDoneByFreelancer: { type: Boolean, default: false },
    taskConfirmed: { type: Boolean, default: false },
    paidNote: { type: String, default: '' },
    proofImage: { type: String, default: null },
    paidAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null }
});

const contractSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    projectTitle: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employerName: { type: String, required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    freelancerName: { type: String, required: true },
    amount: { type: Number, required: true },
    milestones: [milestoneSchema],
    status: { type: String, default: 'active' }, // active, completed, disputed
    reviewedByEmployer: { type: Boolean, default: false },
    reviewedByFreelancer: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('Contract', contractSchema);
