/*
 * Connect all of your endpoints together here.
 */
module.exports = function (app, router) {
    app.use('/api', require('./home.js')(router));
    app.use('/api', require('./taskRoute.js')(router));
    app.use('/api', require('./userRoute.js')(router));
};