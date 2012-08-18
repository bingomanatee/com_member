var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

module.exports = {

    on_validate:function (rs) {
        this.on_process(rs);
    },

    on_process: function(rs){
        rs.clear_session('member');
        rs.flash('info', 'You are now signed out; come again soon!');
        rs.go('/');
    }

}