var NE = require('nuby-express');
var util = require('util');
var _DEBUG = false;
var _DEBUG_OPTIONS = false;
var _ = require('underscore');
var FB = require('./../../node_modules/fb');

/* ***************** CLOSURE ******************* */


/* ****************** MODULE ***************** */

module.exports = {
    init:function (frame, cb) {
        NE.Action.prototype.FB = FB;
        cb();
    }
}

