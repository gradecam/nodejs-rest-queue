/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

var routers = module.exports = {};

var fs = require('fs');

fs.readdirSync(__dirname).forEach(function(filename) {
    if (filename !== 'index.js' && filename.substr(-3) === '.js') {
        var name = filename.substr(0, filename.length - 3);
        routers[name] = require(__dirname + '/' + filename);
    }
});
