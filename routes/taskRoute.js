var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = require('../models/user'),
    task = require('../models/task')
var userModel = mongoose.model('User');
var taskModel = mongoose.model('Task');
module.exports = (router) => {
    var taskRoute = router.route('/tasks');
    var idRoute = router.route('/tasks/:id');
    taskRoute.get(async (req, res) => {
        try {
            whereParam = {};
            sortParam = null;
            selectParam = null;
            skipParam = null;
            limitParam = 100;
            if (req.query.where != undefined) whereParam = JSON.parse(req.query.where);
            if (req.query.sort != undefined) sortParam = JSON.parse(req.query.sort);
            if (req.query.select != undefined) selectParam = JSON.parse(req.query.select);
            if (req.query.skip != undefined) skipParam = parseInt(req.query.skip);
            if (req.query.limit != undefined) limitParam = parseInt(req.query.limit);
            if (req.query.count != undefined) countParam = Boolean(req.query.count);
            if (req.query.count == undefined || req.query.count == "false") out = await taskModel.find(whereParam).sort(sortParam).select(selectParam).skip(skipParam).limit(limitParam).exec();
            else if (req.query.count == "true") out = await taskModel.find(whereParam).sort(sortParam).select(selectParam).skip(skipParam).limit(limitParam).count().exec();
            else {
                res.status(500).json({
                    message: "Failed to get tasks",
                    data: "Count parameter is incomplete or incorrect - should be formatted as count=true or count=false"
                });
                return;
            }
            res.status(200).json({
                message: "Tasks successfully retrieved",
                data: out
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to get tasks",
                data: "Query string parameters may be incorrect"
            });
        }
    });
    taskRoute.post(async (req, res) => {
        const newTask = new taskModel({
            name: req.body.name,
            description: req.body.description,
            deadline: req.body.deadline,
            completed: req.body.completed,
            assignedUser: req.body.assignedUser,
            assignedUserName: req.body.assignedUserName,
            dateCreated: req.body.dateCreated
        });

        if ((req.body.assignedUserName != undefined && req.body.assignedUserName.length != 0 && req.body.assignedUserName != "unassigned") && (req.body.assignedUser == undefined || req.body.assignedUser.length == 0)) {
            res.status(500).json({
                message: "Failed to create task",
                data: "User name provided with no user ID"
            });
            return;
        }
        if ((req.body.assignedUser != undefined && req.body.assignedUser.length != 0)) {
            var curr = null;
            try {
                curr = await userModel.findOne({ "_id": req.body.assignedUser });
            } catch (error) {
                res.status(500).json({
                    message: "Failed to create task",
                    data: "Provided user ID is an invalid ID"
                });
                return;
            }
            if (!curr) {
                res.status(404).json({
                    message: "Failed to create task",
                    data: "Provided user ID does not exist in the database"
                });
                return;
            }
            if (req.body.assignedUserName != undefined && req.body.assignedUserName.length != 0) {
                if (req.body.assignedUserName != curr.name) {
                    res.status(500).json({
                        message: "Failed to create task",
                        data: "The user name associated with the provided ID does not match the provided user name"
                    });
                    return;
                }
            } else newTask.assignedUserName = curr.name;
        }
        if (req.body.name == undefined || req.body.deadline == undefined || req.body.name.length == 0 || req.body.deadline.length == 0) {
            res.status(500).json({
                message: "Failed to create task",
                data: "Required parameter(s) missing"
            });
            return;
        }
        try {
            task = await newTask.save();
            if (task.completed == false && task.assignedUser != "") {
                curr.pendingTasks.push(task._id);
                await userModel.findOneAndUpdate({ "_id": curr._id }, curr);
            }
            res.status(201).json({
                message: "Task successfully created",
                data: task
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to create task",
                data: "Error creating task. One or more variables may have wrong type"
            });
        }
    });
    idRoute.get(async (req, res) => {
        var selectParam = null;
        try {
            if (req.query.select != undefined) selectParam = JSON.parse(req.query.select);
        } catch (error) {
            res.status(500).json({
                message: "Failed to get specified task",
                data: "Select parameter may have wrong type"
            });
            return;
        }
        var curr = null;
        try {
            curr = await taskModel.findOne({ "_id": req.params.id }).select(selectParam).exec();
        } catch (error) {
            res.status(500).json({
                message: "Failed to get specified task",
                data: "Provided task ID is an invalid ID"
            });
            return;
        }
        if (!curr) {
            res.status(404).json({
                message: "Failed to get specified task",
                data: "Provided task ID does not exist in the database"
            });
        } else {
            res.status(200).json({
                message: "Specified task successfully retrieved",
                data: curr
            });
        }
    });
    idRoute.put(async (req, res) => {
        var currTask = null;
        try {
            currTask = await taskModel.findOne({ "_id": req.params.id });
        } catch (error) {
            res.status(500).json({
                message: "Failed to replace task",
                data: "Provided task ID is an invalid ID"
            });
            return;
        }
        if (!currTask) {
            res.status(404).json({
                message: "Failed to replace task",
                data: "Provided task ID does not exist in the database"
            });
            return;
        }
        if (req.body.name == undefined || req.body.deadline == undefined || req.body.name.length == 0 || req.body.deadline.length == 0) {
            res.status(500).json({
                message: "Failed to replace task",
                data: "Required parameter(s) missing"
            });
            return;
        }
        if ((req.body.assignedUserName != undefined && req.body.assignedUserName.length != 0 && req.body.assignedUserName != "unassigned") && (req.body.assignedUser == undefined || req.body.assignedUser.length == 0)) {
            res.status(500).json({
                message: "Failed to replace task",
                data: "User name provided with no user ID"
            });
            return;
        }
        if (req.body.assignedUser != undefined && req.body.assignedUser.length != 0) {
            var curr = null;
            try {
                curr = await userModel.findOne({ "_id": req.body.assignedUser });
            } catch (error) {
                res.status(500).json({
                    message: "Failed to replace task",
                    data: "Provided user ID is an invalid ID"
                });
                return;
            }
            if (!curr) {
                res.status(404).json({
                    message: "Failed to replacae task",
                    data: "Provided user ID does not exist in the database"
                });
                return;
            }
            if (req.body.assignedUserName != undefined && req.body.assignedUserName.length != 0) {
                if (req.body.assignedUserName != curr.name) {
                    res.status(500).json({
                        message: "Failed to replace task",
                        data: "The user name associated with the provided ID does not match the provided user name"
                    });
                    return;
                }
            }
        }
        try {
            descriptionVar = "No description provided";
            completedVar = false;
            assignedUserVar = "";
            assignedUserNameVar = "unassigned";
            dateVar = Date.now();
            if (req.body.dateCreated != undefined) dateVar = req.body.dateCreated;
            if (req.body.completed != undefined) completedVar = req.body.completed;
            if (req.body.description != undefined) descriptionVar = req.body.description;
            if (req.body.assignedUser != undefined && req.body.assignedUser.length != 0) {
                assignedUserVar = curr._id;
                assignedUserNameVar = curr.name;
            }
            replacedTask = {
                name: req.body.name,
                description: descriptionVar,
                deadline: req.body.deadline,
                completed: completedVar,
                assignedUser: assignedUserVar,
                assignedUserName: assignedUserNameVar,
                dateCreated: dateVar
            };
            if (currTask.completed == false && currTask.assignedUser != "") {
                oldUser = await userModel.findOne({ "_id": currTask.assignedUser });
                oldUser.pendingTasks = oldUser.pendingTasks.filter(function (i) { return i != currTask._id });
                await userModel.findOneAndUpdate({ "_id": oldUser._id }, oldUser);
            }
            task = await taskModel.findOneAndUpdate({ "_id": currTask._id }, replacedTask, { new: true });
            if (task.completed == false && task.assignedUser != "") {
                curr.pendingTasks.push(task._id);
                await userModel.findOneAndUpdate({ "_id": curr._id }, curr);
            }
            res.status(200).json({
                message: "Task successfully replaced",
                data: task
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to replace task",
                data: "Error replacing task. One or more variables may have wrong type"
            });
        }
    });
    idRoute.delete(async (req, res) => {
        var curr = null;
        try {
            curr = await taskModel.findOne({ "_id": req.params.id });
        } catch (error) {
            res.status(500).json({
                message: "Failed to delete task",
                data: "Provided task ID is an invalid ID"
            });
            return;
        }
        if (!curr) {
            res.status(404).json({
                message: "Failed to delete task",
                data: "Provided task ID does not exist in the database"
            });
            return;
        } else {
            try {
                result = await taskModel.findByIdAndDelete(req.params.id);
                if (result.assignedUser != "" && result.completed == false) {
                    curr = await userModel.findOne({ "_id": result.assignedUser });
                    curr.pendingTasks = curr.pendingTasks.filter(function (i) { return i != result._id });
                    await userModel.findOneAndUpdate({ "_id": curr._id }, curr);
                }
                res.status(200).json({
                    message: "Task deleted successfully",
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    message: "Failed to delete task",
                    data: "Unknown issue encountered when deleting task or removing task from assignedUser's pendingTasks"
                });
            }
        }
    });
    return router;
}