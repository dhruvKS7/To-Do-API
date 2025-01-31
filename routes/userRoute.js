var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = require('../models/user'),
    task = require('../models/task'),
    userMethods = require('../methods/userMethods')
var userModel = mongoose.model('User');
var taskModel = mongoose.model('Task');
module.exports = (router) => {
    var userRoute = router.route('/users');
    var idRoute = router.route('/users/:id');
    userRoute.get(async (req, res) => {
        try {
            whereParam = {};
            sortParam = null;
            selectParam = null;
            skipParam = null;
            limitParam = null;
            var countText = "";
            if (req.query.where != undefined) whereParam = JSON.parse(req.query.where);
            if (req.query.sort != undefined) sortParam = JSON.parse(req.query.sort);
            if (req.query.select != undefined) selectParam = JSON.parse(req.query.select);
            if (req.query.skip != undefined) skipParam = parseInt(req.query.skip);
            if (req.query.limit != undefined) limitParam = parseInt(req.query.limit);
            if (req.query.count != undefined) countParam = Boolean(req.query.count);
            if (req.query.count == undefined || req.query.count == "false") {
                out = await userModel.find(whereParam).sort(sortParam).select(selectParam).skip(skipParam).limit(limitParam).exec();
            }
            else if (req.query.count == "true") {
                out = await userModel.find(whereParam).sort(sortParam).select(selectParam).skip(skipParam).limit(limitParam).count().exec();
                countText = " count";
            }
            else {
                res.status(500).json({
                    message: "Failed to get users",
                    data: "Count parameter is incomplete or incorrect - should be formatted as count=true or count=false"
                });
                return;
            }
            res.status(200).json({
                message: "Users" + countText + " successfully retrieved",
                data: out
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to get users",
                data: "Query string parameters may be incorrect"
            });
        }
    });
    userRoute.post(async (req, res) => {
        var pendingTasksVar = [];
        try {
            if (req.body.pendingTasks != undefined) {
                pendingTasksVar = req.body.pendingTasks.filter((item,
                    index) => req.body.pendingTasks.indexOf(item) === index);
            }
        } catch (error) {
            res.status(500).json({
                message: "Failed to create user",
                data: "Encountered issue with pendingTasks. May have the wrong data type"
            });
            return;
        }
        const newUser = new userModel({
            name: req.body.name,
            email: req.body.email,
            pendingTasks: pendingTasksVar,
            dateCreated: req.body.dateCreated
        });
        if (req.body.pendingTasks != undefined) {
            try {
                var taskList = req.body.pendingTasks;
                if (typeof req.body.pendingTasks != "object") {
                    taskList = [String(req.body.pendingTasks)];
                }
                if (await userMethods.validTasks(taskList) == false) {
                    res.status(500).json({
                        message: "Failed to create user",
                        data: "One or more of given pendingTasks either does not exist, belongs to another user, or is marked as complete"
                    });
                    return;
                }
            } catch (error) {
                res.status(500).json({
                    message: "Failed to create user",
                    data: "Encountered issue with pendingTasks. One or more of given pendingTasks may not exist"
                });
                return;
            }
        }
        try {
            user = await newUser.save();
            if (req.body.pendingTasks != undefined) {
                await userMethods.updateTasks(taskList, user)
            }
            res.status(201).json({
                message: "User successfully created",
                data: user
            });
        } catch (error) {
            var err_code = 500;
            var msg = "Failed to create user";
            var dt = "";
            if (req.body.name == undefined || req.body.email == undefined || req.body.name.length == 0 || req.body.email.length == 0) {
                dt = "Required parameter(s) missing";
            } else if (await userMethods.doesEmailExist(req.body.email)) {
                dt = "Provided email belongs to another user";
            } else {
                dt = "Unknown error. One or more parameters may have wrong type";
            }
            res.status(err_code).json({
                message: msg,
                data: dt
            });
        }
    });
    idRoute.get(async (req, res) => {
        var selectParam = null;
        try {
            if (req.query.select != undefined) selectParam = JSON.parse(req.query.select);
        } catch (error) {
            res.status(500).json({
                message: "Failed to get specified user",
                data: "Select parameter may have wrong type"
            });
            return;
        }
        var curr = null;
        try {
            curr = await userModel.findOne({ "_id": req.params.id }).select(selectParam).exec();
        } catch (error) {
            res.status(500).json({
                message: "Failed to get specified user",
                data: "Provided user ID is an invalid ID"
            });
            return;
        }
        if (!curr) {
            res.status(404).json({
                message: "Failed to get specified user",
                data: "Provided user ID does not exist in the database"
            });
        } else {
            res.status(200).json({
                message: "Specified user successfully retrieved",
                data: curr
            });
        }
    });
    idRoute.put(async (req, res) => {
        var curr = null;
        try {
            curr = await userModel.findOne({ "_id": req.params.id });
        } catch (error) {
            res.status(500).json({
                message: "Failed to replace user",
                data: "Provided user ID is an invalid ID"
            });
            return;
        }
        if (!curr) {
            res.status(404).json({
                message: "Failed to replace user",
                data: "Provided user ID does not exist in the database"
            });
            return;
        }
        if (req.body.name == undefined || req.body.email == undefined || req.body.name.length == 0 || req.body.email.length == 0) {
            res.status(500).json({
                message: "Failed to replace user",
                data: "Required parameter(s) missing"
            });
            return;
        }
        if (await userMethods.doesEmailExistPut(req.body.email, req.params.id)) {
            res.status(500).json({
                message: "Failed to replace user",
                data: "Provided email already belongs to another user"
            });
            return;
        }
        if (req.body.pendingTasks != undefined) {
            try {
                var taskList = req.body.pendingTasks;
                if (typeof req.body.pendingTasks != "object") {
                    taskList = [String(req.body.pendingTasks)];
                }
                if (await userMethods.validTasksPut(taskList, req.params.id) == false) {
                    res.status(500).json({
                        message: "Failed to replace user",
                        data: "One or more of given pendingTasks either does not exist, belongs to another user, or is marked as complete"
                    });
                    return;
                }
            } catch (error) {
                res.status(500).json({
                    message: "Failed to replace user",
                    data: "Encountered issue with pendingTasks. One or more of given pendingTasks may not exist"
                });
                return;
            }
        }
        try {
            var pendingTasksVar = [];
            try {
                if (req.body.pendingTasks != undefined) {
                    pendingTasksVar = req.body.pendingTasks.filter((item,
                        index) => req.body.pendingTasks.indexOf(item) === index);
                }
            } catch (error) {
                res.status(500).json({
                    message: "Failed to replace user",
                    data: "Encountered issue with pendingTasks. May have the wrong data type"
                });
                return;
            }
            dateVar = Date.now();
            if (req.body.dateCreated != undefined) dateVar = req.body.dateCreated;
            replacedUser = {
                name: req.body.name,
                email: req.body.email,
                pendingTasks: pendingTasksVar,
                dateCreated: dateVar
            };
            user = await userModel.findOneAndUpdate({ "_id": curr._id }, replacedUser, { new: true });
            for (var i = 0; i < curr.pendingTasks.length; i++) {
                task = curr.pendingTasks[i];
                update = {
                    assignedUser: "",
                    assignedUserName: "unassigned"
                }
                await taskModel.findOneAndUpdate({ "_id": task }, update);
            }
            if (taskList != undefined) {
                for (var i = 0; i < taskList.length; i++) {
                    task = taskList[i];
                    update = {
                        assignedUser: curr._id,
                        assignedUserName: req.body.name
                    }
                    await taskModel.findOneAndUpdate({ "_id": task }, update);
                }
            }
            res.status(200).json({
                message: "User successfully replaced",
                data: user
            });
        } catch (error) {
            res.status(500).json({
                message: "Failed to replace user",
                data: "Unknown error. Potential issue with dateCreated parameter, updating user, reassigning pendingTasks"
            });
        }

    });
    idRoute.delete(async (req, res) => {
        var curr = null;
        try {
            curr = await userModel.findOne({ "_id": req.params.id });
        } catch (error) {
            res.status(500).json({
                message: "Failed to delete user",
                data: "Provided user ID is an invalid ID"
            });
            return;
        }
        if (!curr) {
            res.status(404).json({
                message: "Failed to delete user",
                data: "Provided user ID does not exist in the database"
            });
            return;
        } else {
            try {
                result = await userModel.findByIdAndDelete(req.params.id);
                for (var i = 0; i < curr.pendingTasks.length; i++) {
                    task = curr.pendingTasks[i];
                    update = {
                        assignedUser: "",
                        assignedUserName: "unassigned"
                    }
                    await taskModel.findOneAndUpdate({ "_id": task }, update);
                }
                res.status(200).json({
                    message: "User deleted successfully",
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    message: "Failed to delete user",
                    data: "Unknown issue encountered when unassigning tasks and deleting user"
                });
            }
        }
    });
    return router;
}