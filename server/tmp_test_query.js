const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({ name: String });
const projectSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    awardedTo: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);

async function run() {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    const user1 = await User.create({ name: 'Alice' });
    const user2 = await User.create({ name: 'Bob' });

    await Project.create({ user: user1._id, awardedTo: user2._id });

    // Simulate getMyProjects query
    const userId = user1._id.toString(); // or plain obj
    const stringUserId = userId.toString();

    // Query 1: Alice's projects
    const q1 = await Project.find({
        $or: [
            { user: userId },
            { awardedTo: userId },
            { user: stringUserId },
            { awardedTo: stringUserId }
        ]
    }).lean();

    console.log("Alice projects count:", q1.length);
    console.log("Projects:", q1);

    await mongoose.disconnect();
    await mongod.stop();
}

run().catch(console.error);
