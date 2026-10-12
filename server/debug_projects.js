const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const User = require('./models/User');
        const Project = require('./models/Project');

        const projectCount = await Project.countDocuments();
        console.log(`Total Projects: ${projectCount}`);

        const sampleProject = await Project.findOne();
        if (sampleProject) {
            console.log("Sample Project:");
            console.log(`Title: ${sampleProject.title}`);
            console.log(`User ID (type): ${typeof sampleProject.user} - ${sampleProject.user}`);
            console.log(`AwardedTo: ${sampleProject.awardedTo}`);
            console.log(`Status: ${sampleProject.status}`);

            const owner = await User.findById(sampleProject.user);
            if (owner) {
                console.log(`Owner Found: ${owner.name} (${owner._id})`);
            } else {
                console.log("Owner NOT found in users collection!");
            }
        } else {
            console.log("No projects found.");
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

connectDB();
