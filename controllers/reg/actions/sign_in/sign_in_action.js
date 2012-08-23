var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

module.exports = {

    on_get_validate:function (rs) {
        this.on_get_input(rs);
    },

    on_get_input:function (rs) {
        this.on_output(rs, {})
    },

    on_post_validate:function (rs) {
        console.log('req_props: %s', util.inspect(rs.req_props));

        if (!rs.has_content('sign_in.member_name', 'sign_in.password')) {
            this.on_post_validate_error(rs, 'You must log in with a member name and password');
        } else {
            this.on_post_input(rs);
        }
    },

    on_post_input:function (rs) {
        var self = this;
        console.log('trying to find %s', util.inspect(rs.req_props.sign_in))
        this.models.member.find_one(rs.req_props.sign_in, function (err, member) {
            self.on_post_process(rs, err, member);
        })
    },

    on_post_process:function (rs, err, member) {
        if (member) {
            rs.set_session('member', member);
            rs.flash('info', 'logged in');
            rs.render( __dirname + "/load_member_view.html", {member:member, "layout_name":"empty"});
        } else {
            rs.flash('error', 'Sorry, we couldn\'t validate ' + rs.req_props.sign_in.member_name + ' with that password. ');
            rs.go('/sign_in');
        }
    }


}