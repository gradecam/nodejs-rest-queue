/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var isPromiseProviderSet = false;

module.exports = {
    connect: connect,
    createConnection: createConnection,
    setPromiseProvider: setPromiseProvider,
    isPromiseProviderSet: isPromiseProviderSet,
};

/**
 * connect to mongoDB using mongoose's default connection
 *
 * unlike the mongoose.connect method we return the default connection
 */
function connect() {
    setPromiseProvider();
    mongoose.connect.apply(mongoose, arguments);
    var conn = mongoose.connection;
    setupConnectionEventListeners(conn);
    return conn;
}

/**
 * obtain a connection to mongoDB
 */
function createConnection() {
    setPromiseProvider();
    var conn = mongoose.createConnection.apply(mongoose, arguments);
    setupConnectionEventListeners(conn);
    return conn;
}

/**
 * sets the mongoose promise provider
 * @param promiseProvider promiseProvider defaults to q.Promise
 */
function setPromiseProvider(promiseProvider) {
    if (isPromiseProviderSet) { return; }
    promiseProvider = promiseProvider || q.Promise;
    mongoose.PromiseProvider.set(promiseProvider);
}

/**
 * setup an connection error listener and setup handlers to close
 * open connections if the process terminates.
 */
function setupConnectionEventListeners(conn) {
    conn.on('connected', function() {
        var msg = util.format('mongoDB connection open: %s:%s/%s', conn.host, conn.port, conn.db.databaseName);
        console.log(msg);
    });
    conn.on('error', function(err) {
        console.error('mongoose error:', err);
    });
    process.on('SIGINT', closeConnections);
    process.on('SIGTERM', closeConnections);
}

/**
 * close connections to mongoDB when the process terminates
 */
function closeConnections() {
    console.log('\nclosing db connection due to app termination.');
    for (var i=0, len=mongoose.connections.length; i<len; i++) {
        mongoose.connections[i].close();
    }
    process.exit(0);
}

var util = require('util');

var mongoose = require('mongoose');
var q = require('q');
