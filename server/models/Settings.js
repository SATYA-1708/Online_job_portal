const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    platformName: { type: String, default: 'TECHSPARKX' },
    defaultNewUserCredits: { type: Number, default: 3 },
    referralBonusCredits: { type: Number, default: 1 },
    maintenanceMode: { type: Boolean, default: false },
    allowedFileTypes: { type: [String], default: ['image/jpeg', 'image/png', 'application/pdf'] },
    contactEmail: { type: String, default: 'support@techsparkx.com' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
