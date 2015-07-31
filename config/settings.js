/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var ms = require('ms');

var SETTINGS = module.exports = {
    TIMEOUT: ms('60 seconds'),
    NO_WORKER: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    STATUS: {
        SCHEDULED: 'SCHEDULED',
        RUNNING: 'RUNNING',
        FAILED: 'FAILED',
        SUCCESS: 'SUCCESS',
        TIMEDOUT: 'TIMEDOUT',
    },
    EPOCH: function() { return new Date(0); },
    TTL: ms('90 days'),
    LEVELS: {
        0: 'trace', trace: 0,
        10: 'debug', debug: 10,
        20: 'info', info: 20,
        30: 'warn', warn: 30,
        40: 'error', error: 40,
        50: 'fatal', fatal: 50,
        all: 0,
    },
};
