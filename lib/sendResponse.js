/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = {
    middleware: middleware,
    sendResponse: sendResponse,
    registerTranslator: registerTranslator,
    setVersboseErrors: setVersboseErrors,
};

var translators = [], verboseErrors = false;

function sendResponse(res, payload, statusCode) {
    if (!res.json && 'function' === typeof res.json) {
        throw new Error('First parameter must be the response object!');
    }
    q.when(payload).then(function(result) {
        if (!result) {
            return res.status(404).send({error: 'Not Found'});
        }
        if (result instanceof Error) {
            return errorResponse(res, result);
        }
        if (result && result.code && result.data) {
            return res.status(result.code).send(result.data);
        }
        res.status(statusCode || 200);
        return res.send(result);
    }, function(err) {
        return errorResponse(res, err);
    }).done();
}

function errorResponse(res, err) {
    if (err.stack && !(err.hasOwnProperty('logError') && !err.logError) || verboseErrors) {
        console.error('stack:', err.stack);
    }
    res.status(err.statusCode || 500);
    if (typeof err.toJSON === 'function') {
        res.json(err.toJSON());
    } else {
        res.send(err.message || err);
    }
}

function middleware(req, res, next) {
    res.sendResponse = sendResponse.bind(sendResponse, res);
    next();
};

function registerTranslator(fn) {
    if (!fn) { return; }
    if ('function' === typeof fn) {
        translators.push(fn);
    } else if (Array.isArray(fn)) {
        for (var i=0, len=fn.length; i<len; i++) {
            registerTranslator(fn[i]);
        }
    } else {
        var keys = Object.keys(fn);
        for (var i=0, len=keys.length; i<len; i++) {
            registerTranslator(fn[keys[i]]);
        }
    }
}

function setVersboseErrors(verbose) {
    verboseErrors = !!verbose;
}

var q = require('q');
