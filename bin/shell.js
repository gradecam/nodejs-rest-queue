#!/usr/bin/env sh
':' //; exec "$(command -v node)" --harmony "$0" "$@"
/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var ReplPlus = require('repl-plus').ReplPlus;
var config = require('../config');

var conn = config.connectDb(config);

conn.on('connected', function() {
    var repl = new ReplPlus();
    var models = require('restq-mongoose-models').models(conn);
    repl.start({
        prompt: 'restQ> ',
        context: {
            models: models,
            listJobs: listJobs.bind(null, models),
        }
    });
});

function displayResults(results) {
    console.log('\r');
    console.log(results);
}

function listJobs(models) {
    var Job = models.Job;
    Job.find().exec().then(displayResults);
}
