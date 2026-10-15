const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { projects, users } = require('./models/db');
const { connectDB } = require('./models/db');

async function test() {
    await connectDB();

    // Find a user who has projects
    const allProjects = await projects.find().lean();
    if (allProjects.length === 0) {
        console.log("Database has NO projects at all.");
        process.exit(0);
    }

    const sampleDbProject = allProjects[0];
    const userIdObj = sampleDbProject.user || sampleDbProject.awardedTo;

    // Convert to string to simulate what req.user._id provides usually
    const userId = userIdObj.toString();
    const stringUserId = userId;

    console.log(`Testing getMyProjects for User ID: ${stringUserId}`);

    // Duplicate the exact logic from projectController.js
    const userProjects = await projects.find({
        $expr: {
            $or: [
                { $eq: [{ $toString: "$user" }, stringUserId] },
                { $eq: [{ $toString: "$awardedTo" }, stringUserId] }
            ]
        }
    }).sort({ createdAt: -1 }).lean();

    console.log(`$expr query found ${userProjects.length} matching projects.`);

    if (userProjects.length === 0) {
        // Find by old method to see if they differ
        const oldQuery = await projects.find({
            $or: [
                { user: userIdObj },
                { awardedTo: userIdObj },
                { user: stringUserId },
                { awardedTo: stringUserId }
            ]
        }).lean();
        console.log(`Old query method found ${oldQuery.length} projects.`);
    }

    const normalized = userProjects.map((p) => {
        const pObj = { ...p };
        pObj._id = p._id ? p._id.toString() : null;

        if (p.user && typeof p.user === 'object' && p.user._id) {
            pObj.user = p.user._id.toString();
        } else {
            pObj.user = p.user ? p.user.toString() : null;
        }

        if (p.awardedTo && typeof p.awardedTo === 'object' && p.awardedTo._id) {
            pObj.awardedTo = p.awardedTo._id.toString();
        } else {
            pObj.awardedTo = p.awardedTo ? p.awardedTo.toString() : null;
        }

        return pObj;
    });

    console.log("First normalized response item:");
    if (normalized.length > 0) {
        console.log(JSON.stringify(normalized[0], null, 2));
    }

    process.exit(0);
}

test().catch(console.error);
