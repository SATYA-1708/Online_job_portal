const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: __dirname + '/.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log(`Found ${users.length} users in the database.`);
        users.forEach(u => {
            console.log(`- ${u.email} | Role: ${u.role}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

checkUsers();
