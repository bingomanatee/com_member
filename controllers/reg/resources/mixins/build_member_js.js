var NE = require('nuby-express');
var util = require('util');
var _DEBUG = false;
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Gate = NE.deps.support.Gate;
var proper_path = NE.deps.support.proper_path;

/* ***************** CLOSURE ******************* */

/* ****************** MODULE ***************** */

module.exports = {
    init:function (frame, cb) {

        var js_path = proper_path(path.normalize(__dirname + '/../../actions/support/static/js/'));
        console.log('support js path: %s', js_path);
        var c_user_js = fs.createWriteStream(js_path + '/c_member.js');


        var c_js = fs.createReadStream(js_path + '/js.cookie.js');
        var m_js = fs.createReadStream(js_path + '/member.js');
        var mi_js = fs.createReadStream(js_path + '/member_init.js');
        mi_js.on('end', function(){
            console.log('end written');
            c_user_js.end();
            cb();
        });
        c_js.pipe(c_user_js, {end: false});
        m_js.pipe(c_user_js, {end: false});
        mi_js.pipe(c_user_js);
    }
}

