/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = {
    AppError: AppError,
    NotFound: NotFoundError,
    WorkerRequired: WorkerRequiredError,
};

var util = require('util');
var _ = require('lodash');

function AppError(settings, implementationContext) {
    if (!(this instanceof Error)) { return new AppError(settings); }
    if (typeof settings === 'string') { settings = {message: settings} };
    settings = _.extend({logError: true}, settings);
    this.type = settings.type || this.constructor.name;
    this.message = settings.message || 'An error occurred.';
    this.data = settings.data || '';
    this.statusCode = settings.statusCode || settings.code || 500;
    this.isAppError = true;
    this.logError = settings.logError;
    Error.captureStackTrace( this, ( implementationContext || AppError ) );
    return this;
}
util.inherits(AppError, Error);

AppError.prototype.toJSON = function toJSON() {
    return {
        type: this.type,
        message: this.message,
        data: this.data,
        code: this.statusCode,
    };
};

function WorkerRequiredError() {
    if (!(this instanceof Error)) { return new WorkerRequiredError(); }
    AppError.prototype.constructor.call(
        this,
        {code: 400, message: 'must specify worker in request', logError: false},
        WorkerRequiredError
    );
    return this;
}
util.inherits(WorkerRequiredError, AppError);

function NotFoundError(settings) {
    if (!(this instanceof Error)) { return new NotFoundError(settings); }
    if (typeof settings === 'string') { settings = {message: settings}; }
    settings = _.extend({
        code: 404,
        message: 'NotFound',
        logError: false,
    }, settings);
    AppError.prototype.constructor.call(
        this,
        settings,
        NotFoundError
    );
    return this;
}
util.inherits(NotFoundError, AppError);
