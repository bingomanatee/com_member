var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

module.exports = {

    on_get_validate:function (rs) {
        this.on_input(rs);
    },

    on_get_input: function(rs) {
        var member = rs.session('member');

    },

    on_post_validate:function (rs) {
        if (!rs.has_content('log_in')) {
            this.on_post_validate_error(rs, 'no sign_in data');
        } else {
            var login = rs.req_props.log_in;
            if ((!login.member_name) || (!login.password)) {
                this.on_post_validate_error(rs, 'you must enter a username and a password');
            } else {
                this.on_post_input(rs);
            }
        }
    },

    on_post_input:function (rs) {
        this.on_post_process(rs, rs.req_props.log_in);
    },

    on_post_process: function(rs, log_in){
        this.models.member.get(log_in, function(err, member){
            if (member){
                rs.set_session('member', 'member');
                rs.flash('logged in');
                rs.render({member: member, "layout_name": "empty"}, __dirname + "/load_member_view.html");
            }
        })
    }


}