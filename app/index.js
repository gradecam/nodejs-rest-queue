/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var express = require('express');
var app = express();

var exports = module.exports = {
    app: app,
    dbConnect: dbConnect,
};

function dbConnect(config) {
    if (!config) {
        try {
            config = require(__dirname + '/../config/database');
        } catch(e) {
            config = {uri: 'mongodb://localhost:27017/test', options: {}};
        }
    }
    var conn = mongoose.createConnection(config.uri, config.options);
    conn.on('connected', function() {
        console.log('mongodb connection open');
    });
    conn.on('error', function(err) {
        console.error('mongoose error:', err);
    });
    process.on('SIGINT', closeConnections);
    process.on('SIGTERM', closeConnections);
    return conn;
}

function closeConnections() {
    console.log('\nclosing db connection due to app termination.');
    for (var i=0, len=mongoose.connections.length; i<len; i++) {
        mongoose.connections[i].close();
    }
    process.exit(0);
}

function start() {
    var conn = dbConnect();
    var models = require(__dirname + '/../models/')(conn);
    app.use(logger('dev'));
    app.set('port', process.env.PORT || 3030);
    app.use('/job', require(__dirname + '/routers/job')(models.Job));
    conn.on('connected', function() {
        app.listen(app.get('port'));
        console.log('application started, listening on:', app.get('port'));
    });
}

var mongoose = require('mongoose');
var logger = require('morgan');

if (!module.parent) {
    start();
}
