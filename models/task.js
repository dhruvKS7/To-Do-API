var mongoose = require('mongoose');
var TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true, default: "No description provided" },
    deadline: { type: Date, required: true },
    completed: { type: Boolean, required: true, default: false },
    assignedUser: { type: String, default: "" },
    assignedUserName: { type: String, required: true, default: "unassigned" },
    dateCreated: { type: Date, required: true, default: Date.now() }
}, {
    versionKey: false
});
module.exports = mongoose.model('Task', TaskSchema);