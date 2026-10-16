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

    // Force insert string ID into DB bypassing Mongoose
    await Project.collection.insertOne({ user: user1._id.toString(), awardedTo: null });
    // Force insert ObjectId
    await Project.collection.insertOne({ user: user1._id, awardedTo: null });

    const stringUserId = user1._id.toString();

    // Query using native driver to avoid schema casting
    const userProjects = await Project.collection.find({
        $or: [
            { user: stringUserId },
            { user: user1._id },
            { awardedTo: stringUserId },
            { awardedTo: user1._id }
        ]
    }).sort({ createdAt: -1 }).toArray();

    console.log("Found raw driver projects:", userProjects.length);

    await mongoose.disconnect();
    await mongod.stop();
}

run().catch(console.error);
