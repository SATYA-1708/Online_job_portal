const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ name: String });
const User = mongoose.model('User2', userSchema);

const doc = new User({ name: 'Test' });
const obj = doc.toObject();

console.log("Type of _id in toObject():", typeof obj._id);
console.log("Is obj._id an ObjectId instance?", obj._id instanceof mongoose.Types.ObjectId);
console.log("Is obj._id a string?", typeof obj._id === 'string');
