var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = require('../models/user'),
    task = require('../models/task')
var userModel = mongoose.model('User');
var taskModel = mongoose.model('Task');

const userMethods = {
    doesEmailExist: async (email) => {
        var out = await userModel.findOne (
            {"email" : email}
        )
        return out ? true : false;
    },

    doesEmailExistPut: async (email, id) => {
        var out = await userModel.findOne (
            {"email" : email}
        )
        if (!out) return false;
        else {
            if (out._id == id) return false;
        }
        return true;
    },

    validTasks: async (taskList) => {
        for (var i = 0; i < taskList.length; i++) {
            task = taskList[i];
            out = await taskModel.findOne({_id : task});
            if (out == null) return false;
            if (out.completed == true) return false;
            if (out.assignedUser != "") return false;
        }
        return true;
    },

    validTasksPut: async (taskList, id) => {
        for (var i = 0; i < taskList.length; i++) {
            task = taskList[i];
            out = await taskModel.findOne({_id : task});
            if (out == null) return false;
            if (out.completed == true) return false;
            if (out.assignedUser == "") return true;
            if (out.assignedUser == id) return true;
            return false;
        }
        return true;
    },

    updateTasks: async (taskList, user) => {
        for (var i = 0; i < taskList.length; i++) {
            task = taskList[i];
            update = {
                assignedUser: user._id,
                assignedUserName: user.name
            }
            await taskModel.findOneAndUpdate({"_id" : task}, update);
        }
        return;
    }
}

module.exports = userMethods;