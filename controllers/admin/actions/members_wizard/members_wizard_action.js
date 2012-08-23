var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');
var validate_admin = require('validate_admin');

/* ***************** CLOSURE ************* */

/* ***************** MODULE *********** */

module.exports = {

    /* *************** GET RESPONSE METHODS ************** */

    on_get_validate:function (rs) {
        if (!validate_admin(rs, '', this)) {
            return;
        }
        var self = this;
        this.on_get_input(rs);
    },

    on_get_input:function (rs) {
        var self = this;
        this.models.cc_options.option_value(['fb_app_id', 'fb_app_secret', 'fb_domain'], function (err, values) {
            if (err) {
                self.on_get_input_error(rs, err);
            } else {
                console.log('values: %s', util.inspect(values));
                self.on_get_process(rs, {options:{fb:values}});
            }
        })
    },

    on_get_process:function (rs, values) {
        var self = this;
        this.on_output(rs, values);
    },

    // note - there is no "on_get_output()' function because on_output is the normal output for get

    _on_get_error_go:true,

    /* ***************** POST RESPONSE METHODS ************ */

    on_post_validate:function (rs) {
        if (!validate_admin(rs, '', this)) {
            return;
        }

        if (!rs.has_content('order') && parseInt(rs.req_props.order)) {
            this.on_post_validate_error(rs, 'No order');
        } else {
            switch (parseInt(rs.req_props.order)) {
                case 1:
                    if (rs.has_content('options.fb_app_id', 'options.fb_app_secret', 'options.fb_domain')) {
                        this.on_post_input(rs);
                    } else {
                        this.on_post_validate_error(rs, 'no options for fb: ' + util.inspect(rs.req_props));
                    }
                    break;

                case 2:

                    this._member_state(rs);

                    break;
            }

        }
    },

    _member_state:function (rs) {
        var self = this;

        switch (rs.req_props.phase) {
            case 'load':
                this.models.wizard_state.get_state(function (err, state) {
                    rs.send({state:state});
                }, 'member_init', 'create_admin_member')

                break;

            case 'validation':
                this._validate_member_form(rs, function (err, valid) {
                    rs.send({error:err, valid:valid});
                })
                break;

            case 'save':
                console.log('saving member %s', util.inspect(rs.req_props.member));

                this._validate_member_form(rs, function (err, valid) {
                    console.log('...   validation result: %s', util.inspect(err));
                    if (err) {
                        rs.send({error:err, valid:valid});
                    } else {
                        self.models.member.put(rs.req_props.member, function (err, member) {
                            if (err) {
                                rs.send({error:err, valid:false})
                            } else {
                                self.models.wizard_sate.set_state(function(err, state){
                                    rs.send({error:err, valid:true, state:state})
                                }, {member: member});
                            }
                        })
                    }
                })
                break;
        }
    },

    _validate_member_form:function (rs, cb) {

        if (!rs.has_content('member.member_name', 'member.real_name', 'member.password', 'member.password2')) {
            var msg = util.format('You must fill out all the fields. You have only filled out %s', _.keys(rs.req_props.member).join(','))
            cb({title:'Incomplete State', message:msg})
        } else if (rs.req_props.member.password != rs.req_props.member.password2) {
            cb({title:'Mismatched Passwords', content:'Your passwords are mismatched'});
        } else {
            var r_member = rs.req_props.member;
            this.models.member.find_one({member_name:r_member.member_name, deleted:false},
                function (err, member) {
                    if (!member) {
                        cb(null, true);
                    } else {
                        cb({
                            title:'Member', message:util.format('there is already a member named %s for this site.',
                                r_member.member_name)
                        });
                    }
                })
        }
    },

    on_post_input:function (rs) {
        switch (parseInt(rs.req_props.order)) {
            case 1:
                this.on_post_process_fb(rs, rs.req_props.options);
                break;

            default:
                this.on_post_input_error(rs, 'cannot understand order ' + rs.req_props.order);
        }
    },

    on_post_process_fb:function (rs, options) {
        //   console.log('processing fb');
        this.models.cc_options.set_options(options, function (err, kr) {
            //     console.log('err: %s, result: %s', util.inspect(err), util.inspect(kr))
            if (err) {
                self.on_post_process_fb_error(rs, 'cannot set options %s: %s', util.inspect(options), err.message);
            } else {
                rs.send({success:true, result:kr});
            }
        });
    },

    _on_post_error_go:true
}