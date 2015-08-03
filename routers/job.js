/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function(Job, opts) {
    var router = require('express').Router();
    router.use(sendResponse.middleware);
    router.use(bodyParser.json(opts || {limit: '1024kb'}));
    router.use(bodyParser.urlencoded({extended: false}));
    Job = Job || require(__dirname + '/../../models/job')();

    router.get('/', function demo(req, res) {
        res.send({hello: 'world!'});
    });

    router.post('/next', function nextJob(req, res) {
        var opts = {};
        var body = req.body;
        if (!body.worker) {
            res.status(400).send({error: 'Worker must be specified.'});
            return;
        }
        res.sendResponse(co(function*() {
            var expired = yield Job.findExpired();
            expired = yield _.map(expired, function(j) {
                return j.finish(STATUS.TIMEDOUT);
            });
            var job = yield Job.findNext(opts, body.worker);
            if (!job) {
                job = yield Job.findFuture(opts);
                if (job) {
                    return {
                        code: job.lockExpires && 409 || 404,
                        data: {
                            next: job.lockExpires || job.scheduledAt,
                        }
                    };
                }
                return null;
            }
            return job;
        }));
    });

    router.post('/:job/log', function *createLogEntry() {
        var job = this.state.job;
        var body = this.request.body;
        var data = yield job.addLogEntry(body.entry);
        this.body = data.job;
    });

    return router;
};

var _ = require('lodash');
var co = require('co');
var bodyParser = require('body-parser');

var sendResponse = require(__dirname + '/../../lib/sendResponse');
var STATUS = require(__dirname + '/../../config/settings').STATUS;
