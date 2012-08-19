var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

module.exports = {

    on_get_validate:function (rs) {
        this.on_get_input(rs);
    },

    on_get_input: function(rs) {
        var member = rs.session('member');
        this.on_output(rs, {member: member})
    },

    on_post_validate:function (rs) {
        console.log('req_props: %s', util.inspect(rs.req_props));
        console.log('req_props: %s', rs.req_props);
        if (!rs.has_content('sign_in')) {
            this.on_post_validate_error(rs, 'no sign_in data');
        } else {
            var sign_in = rs.req_props.sign_in;
            if ((!sign_in.member_name) || (!sign_in.password)) {
                this.on_post_validate_error(rs, 'you must enter a member name and a password');
            } else {
                this.on_post_input(rs);
            }
        }
    },

    on_post_input:function (rs) {
        this.on_post_process(rs, rs.req_props.sign_in);
    },

    on_post_process: function(rs, log_in){
        var self = this;
        this.models.member.get(log_in, function(err, member){
            if (member){
                rs.set_session('member', 'member');
                rs.flash('info', 'logged in');
                rs.render({member: member, "layout_name": "empty"}, __dirname + "/load_member_view.html");
            } else {
                rs.flash('error', 'Sorry, we couldn\'t validate ' + log_in.member_name + ' with that password. ');
                rs.go('/sign_in');
            }
        })
    }


}