/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function routerGenerator(Job, opts) {
    var router = require('express').Router();
    if (!Job) { throw new Error('must provide controller.'); }
    router.use(sendResponse.middleware);
    router.use(bodyParser.json(opts || {limit: '1024kb'}));
    router.use(bodyParser.urlencoded({extended: false}));

    router.use(function(req, res, next) {
        req.state = {};
        next();
    });

    router.post('/next', [timeoutExpiredMiddleware], function nextJob(req, res) {
        console.log('next handler');
        var body = req.body;
        var opts = {};
        if (!body.worker) {
            return res.sendResponse(errors.WorkerRequired());
        }
        res.sendResponse(Job.findNext(opts, body.worker).then(function(job) {
            if (job) { return job; }
            return Job.findFuture(opts).then(function(job) {
                if (!job) { return errors.NotFound(); }
                return errors.NotFound({
                    code: job.lockExpires && 409 || 404,
                    data: {next: job.lockExpires || job.scheduledAt},
                });
            })
        }));
    });

    function timeoutExpiredMiddleware(req, res, next) {
        Job.findExpired().then(function(expired) {
            return q.all(_.map(expired, function(job) {
                return job.finish('timedout');
            }));
        })
        .then(function() {
            next();
        }, function(err) {
            next(err);
        }).done();
    }

    router.get('/expired', function expiredJobs(req, res) {
        return res.sendResponse(Job.findExpired({}, true));
    });

    router.param('jobId', function jobParam(req, res, next, jobId) {
        console.log('jobId param middleware:', jobId);
        var worker = req.body.worker;
        var job;
        if (req.method === 'GET') {
            job = q(Job.findById(jobId).exec());
        } else {
            if (!worker) { return res.sendResponse(errors.WorkerRequired()); }
            job = Job.findAssigned({id: jobId, worker: worker});
        }
        req.state.job = job;
        next();
    });

    router.route('/:jobId/logs')
        .get(function getLogEntries(req, res) {
            return res.sendResponse(q.when(req.state.job).then(function(job) {
                return job.logEntries();
            }));
        })
        .post(function createLogEntry(req, res) {
            var body = req.body;
            res.sendResponse(q.when(req.state.job).then(function(job) {
                if (!job) { return errors.NotFoundError(); }
                var entry = job.addLogEntry(body.entry);
                return q.all([job.addLogEntry(body.entry), job.save()]).spread(function(entry) {
                    return entry;
                });
            }));
        });

    router.get('/:jobId', function getJob(req, res) {
        return q.when(req.state.job).then(function(job) {
            res.sendResponse(job);
        }, function(err) {
            console.error('error loading job:', err && err.message);
            console.error(err.stack);
            res.sendResponse(errors.NotFound());
        }).done();
    });

    return router;
};

var _ = require('lodash');
var bodyParser = require('body-parser');
var q = require('q');

var sendResponse = require('../lib/sendResponse');
var errors = require('../lib/errors');
