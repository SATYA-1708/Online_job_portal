const mongoose = require('mongoose');

// Import Mongoose Models
const User = require('./User');
const Project = require('./Project');
const Message = require('./Message');
const Contract = require('./Contract');
const Referral = require('./Referral');
const Review = require('./Review');
const Report = require('./Report');
const ActivityLog = require('./ActivityLog');
const Settings = require('./Settings');
const VerificationRequest = require('./VerificationRequest');
const Notification = require('./Notification');
const Otp = require('./Otp');

const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.log('Server continuing in offline mode...');
        // Do not exit, allow server to start for UI testing
    }
};

module.exports = {
    connectDB,
    users: User,
    projects: Project,
    messages: Message,
    contracts: Contract,
    referrals: Referral,
    reviews: Review,
    reports: Report,
    activityLogs: ActivityLog,
    settings: Settings,
    verificationRequests: VerificationRequest,
    notifications: Notification,
    otps: Otp
};
