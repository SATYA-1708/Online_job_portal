const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB, projects, users } = require('./models/db');

async function test() {
    await connectDB();
    const allUsers = await users.find({});
    if (allUsers.length === 0) {
        console.log("No users found.");
        process.exit(0);
    }

    for (const u of allUsers) {
        const userId = u._id;
        const p = await projects.find({
            $or: [
                { user: userId },
                { awardedTo: userId }
            ]
        });
        console.log(`User ${u.name} (${userId}) has ${p.length} projects`);
        if (p.length > 0) {
            console.log("Projects:", p.map(proj => ({
                id: proj._id,
                title: proj.title,
                user: proj.user,
                awardedTo: proj.awardedTo,
                status: proj.status
            })));
        }
    }
    process.exit(0);
}

test();
