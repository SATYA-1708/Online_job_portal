const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    documentType: { type: String, required: true, enum: ['Aadhaar', 'Passport', 'Driving License', 'PAN Card'] },
    documentImage: { type: String, required: true }, // Store the filename/URL to the uploaded document
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
