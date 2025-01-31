var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pendingTasks: { type: [String], required: true, default: [] },
    dateCreated: { type: Date, required: true, default: Date.now() }
}, {
    versionKey: false
});
module.exports = mongoose.model('User', UserSchema);