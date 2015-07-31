/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function(conn) {
    conn = conn || mongoose;

    var JobSchema = new Schema({
        def: {type: SchemaTypes.ObjectId, ref: 'JobDef', required: true},
        topic: {type: String, required: true},
        name: {type: String, required: true},
        attempt: {type: Number, required: true, default: 1},
        timeout: {type: Number, required: true, default: SETTINGS.TIMEOUT},
        created: {type: Date, required: true, default: Date.now},
        scheduledAt: {type: Date, required: true, default: SETTINGS.EPOCH},
        status: {type: String, required: true,
            enum: Object.keys(STATUS),
            default: STATUS.SCHEDULED},
        args: {type: SchemaTypes.Mixed, required: true},
        lockExpires: {type: Date, required: false, default: null},
        worker: {type: String, required: true, default: NO_WORKER},
        started: {type: Date},
        finished: {type: Date},
    });

    JobSchema.index({def: 1, status: 1});
    JobSchema.index({status: 1, scheduledAt: 1, worker: 1, topic: 1});
    JobSchema.index({status: 1, lockExpires: 1, topic: 1});

    JobSchema.statics.findNext = function findNext(opts, worker) {
        var query = _.extend({
            status: STATUS.SCHEDULED,
            scheduledAt: {$lte: new Date()},
            worker: NO_WORKER,
        }, opts);
        var update = {
            status: STATUS.RUNNING,
            worker: worker,
            started: new Date(),
        };
        return co(function *() {
            var job = yield Job.findOneAndUpdate(query, update, {new: true}).exec();
            var LogEntry = conn.model('LogEntry');
            if (job) {
                var updates = yield {
                    job: job.save(),
                    logEntry: LogEntry.create({
                        job: job._id,
                        ts: job.started,
                        level: 'info',
                        message: util.format('started: %s', worker),
                    }),
                };
                job = updates.job;
            }
            return job;
        });
    };

    JobSchema.statics.findFuture = function findFuture(opts) {
        var now = new Date();
        var future = _.extend({
            status: STATUS.SCHEDULED,
            scheduledAt: {$gte: now},
            worker: NO_WORKER,
        }, opts);
        var current = {status: STATUS.RUNNING, lockExpires: {$gte: now}};
        if (opts.topic) {
            current.topic = opts.topic;
        }
        var query = {$or: [future, current]};
        return Job.findOne(query).exec();
    };

    JobSchema.statics.findExpired = function findExpired(opts) {
        var query = _.extend({
            status: STATUS.RUNNING,
            lockExpires: {$lte: new Date()},
        }, opts);
        return Job.find(query).populate('def').exec();
    };

    JobSchema.methods.finish = function finish(status) {
        var self = this;
        var LogEntry = conn.model('LogEntry');
        self.status = status;
        self.finished = new Date();
        return co(function*() {
            var updates = {
                logEntry: LogEntry.create({
                    job: self._id,
                    level: 'info',
                    message: util.format('finished: %s', self.status),
                }),
                job: self.save(),
            };
            yield updates;
            if (typeof(self.def.scheduleJob) === 'function') {
                // make sure we are dealing with a populated object
                updates.newJob = self.def.scheduleJob(self);
            }
            return updates.newJob;
        });
    };

    JobSchema.methods.addLogEntry = function addLogEntry(entry) {
        var self = this;
        var LogEntry = conn.model('LogEntry');
        entry = _.extend({job: self._id}, entry);
        var updates = {
            logEntry: LogEntry.create(entry),
            job: self.save(),
        };
        return updates;
    };

    JobSchema.pre('save', function(next) {
        var self = this;
        if (self.status === STATUS.RUNNING) {
            this.lockExpires = moment().add(self.timeout, 'milliseconds').toDate();
        }
        next();
    });

    var Job = conn.model('Job', JobSchema);

    return Job;
};

var util = require('util');

var co = require('co');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    _ = require('lodash'),
    moment = require('moment-timezone');

var SETTINGS = require(__dirname + '/../config/settings'),
    STATUS = SETTINGS.STATUS,
    NO_WORKER = SETTINGS.NO_WORKER;
