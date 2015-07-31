#!/usr/bin/env sh
':' //; exec "$(command -v node)" --harmony "$0" "$@"
/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var MongooseReplPlus = require('repl-plus').MongooseReplPlus;

var mr = new MongooseReplPlus()
    .connect()
    .includeDir(__dirname + '/../models')
    .start({prompt: 'restQ> ', context: {listJobs: listJobs}});

function displayResults(results) {
    console.log('\r');
    console.log(results);
}

function listJobs() {
    var Job = mongoose.models.Job;
    Job.find().exec().then(displayResults);
}

var mongoose = require('mongoose');
