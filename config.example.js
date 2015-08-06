/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var env = process.env.NODE_ENV || 'dev';
var util = require('util');

var configs = {
    dev: {
        db: {uri: 'mongodb://localhost:27017/restq_dev', options: {}},
        port: 3030,
        log: true,
    },
    test: {
        db: {uri: 'mongodb://localhost:27017/restq_test', options: {}},
        port: 3030,
        log: false,
    },
};

var config = module.exports = configs[env];
config.env = env;

if (process.env.PORT) {
    config.port = process.env.PORT;
}

if (process.env.MONGO_HOST) {
    var host = process.env.MONGO_HOST;
    var port = process.env.MONGO_PORT || 27017;
    var db = process.env.MONGO_DB || 'restq';
    config.db = {
        uri: util.format('mongodb://%s:%s/%s', host, port, db),
        options: json.options,
    };
}

if (process.env.MONGO_JSON) {
    var json = JSON.parse(process.env.MONGO_JSON);
    var host = json.host || 'localhost';
    var port = json.port || 27017;
    var db = json.db || 'restq';
    config.db = {
        uri: util.format('mongodb://%s:%s/%s', host, port, db),
        options: json.options,
    };
}
