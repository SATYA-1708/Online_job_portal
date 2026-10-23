const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const makeAdmin = async () => {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address. Usage: node makeAdmin.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success! User ${email} is now an admin.`);
        console.log(`Log out and log back in to see the Admin Panel at /admin.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

makeAdmin();
