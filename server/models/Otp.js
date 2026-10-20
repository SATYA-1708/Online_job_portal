const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ['registration', 'password_reset'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Expires after 10 minutes
});

module.exports = mongoose.model('Otp', otpSchema);
