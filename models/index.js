/* vim: set softtabstop=4 ts=4 sw=4 expandtab tw=120 syntax=javascript: */
/* jshint node:true, unused:true */
'use strict';

module.exports = function(conn) {
    return {
        Job: require(__dirname + '/job')(conn),
        JobDef: require(__dirname + '/jobdef')(conn),
        LogEntry: require(__dirname + '/logentry')(conn),
    };
}
