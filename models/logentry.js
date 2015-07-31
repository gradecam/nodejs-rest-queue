/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function(conn) {
    conn = conn || mongoose;

    var LogEntrySchema = new Schema({
        job: {type: SchemaTypes.ObjectId, ref: 'Job', required: true},
        ts: {type: Date, required: true, default: Date.now},
        level: {type: Number, required: true, set: setLogLevel, get: getLogLevel},
        message: {type: String, required: true},
    });

    LogEntrySchema.index({job: 1, ts: 1, level: 1});

    var LogEntry = conn.model('LogEntry', LogEntrySchema);

    return LogEntry;
};

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var SETTINGS = require(__dirname + '/../config/settings'),
    LEVELS = SETTINGS.LEVELS;

function getLogLevel(level) {
    return LEVELS[level] || level;
}

function setLogLevel(level) {
    return LEVELS[('' + level).toLowerCase()] || level;
}
