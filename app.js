/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var app = module.exports = require('express')();

app.attachDefaultRouters = attachDefaultRouters;
app.start = start;

function attachDefaultRouters(controllers) {
    app.use('/jobs', require('./routers/job')(_.get(controllers, 'Job')));
    return app;
}

function start(opts) {
    opts = opts || {};
    app.set('port', _.get(opts, 'config.port', 3030));
    app.set('models', opts.models);
    attachDefaultRouters(opts.controllers || opts.models);
    app.listen(app.get('port'));
    app.use(function(err, req, res, next) {
        console.error(err.stack);
        res.status(500).send('An unexpected error occurred.');
    });
    console.log('application started, listening on:', app.get('port'));
}

var _ = require('lodash');

if (!module.parent) {
    var config = require('./config');
    var conn = config.connectDb(config);
    app.use(require('morgan')(config.env));
    conn.on('connected', function() {
        start({
            config: config,
            models: require('./models')(conn),
        });
    })
}
