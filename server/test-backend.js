const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB, projects, users } = require('./models/db');

async function test() {
    await connectDB();
    const allUsers = await users.find({});
    console.log(`Found ${allUsers.length} users.`);

    for (const u of allUsers) {
        const userId = u._id;
        const p = await projects.find({
            $or: [
                { user: userId },
                { awardedTo: userId }
            ]
        }).sort({ createdAt: -1 }).lean();

        console.log(`User ${u.name} (${userId}) has ${p.length} projects`);
        if (p.length > 0) {
            const normalized = p.map(proj => {
                const pObj = { ...proj };
                pObj._id = proj._id ? proj._id.toString() : null;
                pObj.user = proj.user ? proj.user.toString() : null;
                pObj.awardedTo = proj.awardedTo ? proj.awardedTo.toString() : null;
                return pObj;
            });
            console.log(JSON.stringify(normalized, null, 2));
        }
    }
    process.exit(0);
}

test();
