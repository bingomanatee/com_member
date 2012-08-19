var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');
var _DEBUG = false;

module.exports = {

    _msg: {
        already_reg: 'You already are registered on this site.',
        no_pass_fb: 'You need to either provide a password or sync the account with Facebook.',
        short_pass: 'your password must be %s characters long or longer.',
        reg_w_fb: 'you are already registered; log in with Facebook',
        pw2: 'You must include your password twice',
        cr_succ: 'You are now a member',
        cr_err: 'cannot create member'
    },

    on_get_validate:function (rs) {
        if (rs.session('member')) {
            rs.set_session('is_member', 1);
        }
        if (rs.session('is_member')) {
            rs.flash('info', this._msg.already_reg);
            rs.go('/');
        }
        this.on_output(rs, {});
    },

    on_post_validate:function (rs) {
        console.log('joining with %s', util.inspect(rs.req_props));
        this.on_post_input(rs);
    },

    on_post_input:function (rs) {
        if (_DEBUG) console.log('on post input')

        var self = this;
        var facebook_data = rs.req_props.facebook_data;

        if (_DEBUG) console.log('facebook_data: %s', util.inspect(facebook_data));

        var new_member = {
            member_name:rs.req_props.member_name,
            real_name:rs.req_props.real_name,
            public_profile:rs.req_props.public_profile,
            private_profile:rs.req_props.private_profile,
            oauth:[ ]
        };

        if (facebook_data) {
            try {
                facebook_data = JSON.parse(facebook_data);
                if (_DEBUG)  console.log('facebook_data: %s', util.inspect(facebook_data));
                this.on_post_process(rs, new_member, facebook_data);
            } catch (err) {
                if (_DEBUG) console.log('error: %s', err.message)
                this.on_post_input_error(rs, err);
            }

        } else if (rs.req_props.password) {
            if (_DEBUG) console.log('getting options');

                this.models.cc_options.get_option('member_password_min_length', function (err, min_length) {
                if (!min_length) {
                    min_length = 1;
                }
                if (!self._good_password(rs, min_length)) {
                    new_member.password = rs.req_props.password;
                    self.on_post_process(rs, new_member, null, min_length);
                } else {
                    self.on_output(rs, new_member);
                }
            })
        } else {
            this.on_post_input_error(rs, this._msg.no_pass_fb);
        }
    },

    _good_password:function (rs, min_length) {
        if (rs.has_content('password', 'password2')) {
            if (rs.req_props.password == rs.req_props.password2) {
                if (rs.req_props.password.length >= min_length);
            } else {
                rs.flash('error', util.format(this._msg.short_pass, min_length));
                return false;
            }
        } else {
            rs.flash('error', this._msg.pw2);
            return false;
        }
    },

    on_post_process:function (rs, new_member, facebook_data, min) {
        if (_DEBUG) console.log('on_post_process');
        if (facebook_data) {
            this._add_facebook_member(rs, new_member, facebook_data);
        } else {
            this._add_member(rs, new_member);
        }

    },

    _add_member: function(rs, member){
        var self = this;
        this.models.member.add(member, function (err, nm) {
            if (err) {
                self.on_post_validate_error(rs, err);
            } else if (nm) {
                rs.set_session('member', nm);
                rs.flash('info', self._msg.cr_succ);
                rs.go('/');
            } else {
                rs.flash('error', self._msg.cr_err);
                rs.go('/');
            }
        })
    },

    _add_facebook_member:function (rs, new_member, facebook_data) {
        if (_DEBUG) console.log('adding fb member %s to %s', util.inspect(facebook_data), util.inspect(new_member));
        var self = this;

        if (!new_member.member_name) {
            new_member.member_name = facebook_data.name;
        }
        new_member.oauth.push(
            {
                service:'facebook',
                id:facebook_data.id,
                metadata:facebook_data
            });

        this.models.member.find_oauth('facebook', facebook_data.id, function (err, member) {
           if (_DEBUG) console.log('find oauth: error: %s, member: %s', util.inspect(err), util.inspect(member));
            if (err) {
                self.on_post_validate_error(rs, err);
            } else if (member) {
                rs.set_session('member', member);
                rs.flash('error', this._msg.reg_w_fb);
                rs.go('/');
            } else {
                self._add_member(rs, new_member);
            }


        });
    },

    _on_post_error_go:'/'

}