const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({ name: String });
const projectSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    awardedTo: { type: Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);

const userId = new mongoose.Types.ObjectId();
const stringUserId = userId.toString();

const q1 = Project.find({
    $or: [
        { user: userId },
        { awardedTo: userId },
        { user: stringUserId },
        { awardedTo: stringUserId }
    ]
});
console.log("Casted filter:");
console.dir(q1.cast(Project), { depth: null });
