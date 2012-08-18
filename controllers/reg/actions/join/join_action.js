var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

module.exports = {

    on_get_validate:function (rs) {
        if (rs.session('member')) {
            rs.set_session('is_member', 1);
        }
        if (rs.session('is_member')) {
            rs.flash('info', 'You already are registered on this site.')
            rs.go('/');
        }
        this.on_output(rs, {});
    },

    on_post_validate:function (rs) {
        console.log('joining with %s', util.inspect(rs.req_props));
        this.on_post_input(rs);
    },

    on_post_input:function (rs) {
        var self = this;
        var facebook_data = rs.req_props.facebook_data;
        console.log('facebook_data: %s', util.inspect(facebook_data));

        var new_member = {
            member_name:rs.req_props.name,
            real_name:rs.req_props.real_name,
            public_profile:rs.req_props.public_profile,
            private_profile:rs.req_props.private_profile,
            oauth:[ ]
        };

        if (facebook_data) {
            try {
                facebook_data = JSON.parse(facebook_data);
                console.log('facebook_data: %s', util.inspect(facebook_data));
                this.on_post_process(rs, new_member, facebook_data);
            } catch (err){
                console.log('error: %s', err.message)
               this.on_post_input_error(rs, err);
            }

        } else {
            return this.on_post_input_error(rs, 'No facebook data');
            this.on_post_process(rs, new_member);
        }
    },

    on_post_process:function (rs, new_member, facebook_data) {

        if (facebook_data) {
            this._add_facebook_member(rs, new_member, facebook_data);
        }


    },

    _add_facebook_member:function (rs, new_member, facebook_data) {
        console.log('adding fb member');
        var self = this;

        if(!new_member.member_name){
            new_member.member_name = facebook_data.name;
        }
        new_member.oauth.push(
            {
                service:'facebook',
                id:facebook_data.id,
                metadata:facebook_data
            });

        this.models.member.find_oauth('facebook', facebook_data.id, function (err, member) {
            console.log('mfo: %s :: %s', util.inspect(err), util.inspect(member));
            if (err) {
                self.on_post_validate_error(rs, err);
            } else if (member) {
                rs.set_session('member', member);
                rs.flash('error', 'you are already registered; log in with facebook');
                rs.go('/log_in');
            } else {
                self.models.member.add(new_member, function (err, nm) {
                    if (err) {
                        self.on_post_validate_error(rs, err);
                    } else if (nm) {
                        rs.set_session('member', nm);
                        rs.flash('info', 'You are now a member');
                        rs.go('/');
                    } else {
                        rs.flash('error', 'cannot create member');
                        rs.go('/');
                    }
                })
            }



        });
    },

    _on_post_error_go: '/'

}