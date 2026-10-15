const mongoose = require('mongoose');

const id = new mongoose.Types.ObjectId();
const leanObj = { _id: id, user: id };
console.log("JSON:", JSON.stringify(leanObj));
