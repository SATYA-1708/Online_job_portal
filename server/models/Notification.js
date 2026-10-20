const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['success', 'info', 'warning'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // Optional URL to navigate to when clicked
    read: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
