/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function(conn) {
    conn = conn || mongoose;

    var JobDefSchema = new Schema({
        topic: {type: String, required: false, default: null},
        name: {type: String, required: true},
        schedule: {type: String, required: true},
        attempts: {type: Number, required: true, default: 1},
        timeout: {type: Number, required: true, default: SETTINGS.TIMEOUT},
        args: {type: SchemaTypes.Mixed, required: true},
        paused: {type: Boolean, required: true, default: false},
    });

    JobDefSchema.methods.scheduleJob = function scheduleJob(job) {
        var self = this;
        if (self.paused) {
            return null;
        }
        var Job = conn.model('Job');
        return co(function*() {
            var attempt = getAttemptNum(job, self.attempts);
            var query = {def: self._id, status: {$in: [STATUS.SCHEDULED, STATUS.RUNNING]}};
            var schAt = nextSchedule(self.schedule, attempt > 1);
            job = yield Job.findOne(query).exec()
            if (!job) {
                job = yield (new Job({
                    def: self._id,
                    attempt: attempt,
                    scheduledAt: schAt,
                    worker: NO_WORKER,
                    topic: self.topic,
                    name: self.name,
                    args: self.args,
                    timeout: self.timeout,
                })).save();
            }
            return job;
        });
    };

    JobDefSchema.post('save', function postSave(doc) {
        console.log('doc:', doc);
        return doc.scheduleJob();
    });

    var JobDef = conn.model('JobDef', JobDefSchema);

    return JobDef;
};

function getAttemptNum(job, maxAttempts) {
    if (!job || job && job.attempt == maxAttempts || job.status === STATUS.SUCCESS) {
        return 1;
    }
    return job.attempt + 1;
}

function nextSchedule(schedule, immediate) {
    if (immediate) {
        return new Date(0);
    }
    if (_.isNaN(Date.parse(schedule))) {
        return cronParser(schedule).next();
    } else {
        return moment(schedule).toDate();
    }
}

var cronParser = require('cron-parser').parseExpression;
var moment = require('moment-timezone');
var _ = require('lodash');
var co = require('co');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;

var SETTINGS = require(__dirname + '/../config/settings'),
    NO_WORKER = SETTINGS.NO_WORKER,
    STATUS = SETTINGS.STATUS;
