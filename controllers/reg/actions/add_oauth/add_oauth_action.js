var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

/* ***************** CLOSURE ************* */

/* ***************** MODULE *********** */

module.exports = {

    on_validate:function (rs) {

        console.log('req_props: %s', util.inspect(rs.req_props));

        if (!rs.has_content('service', 'user')) {
            this.on_validate_error(rs, 'no data for service or user');

        } else if (rs.req_props.user.id && rs.req_props.user.name) {
            this.on_input(rs)
        } else {
            this.on_validate_error(rs, 'invalid user: %s', util.inspect(rs.req_props.user));
        }
    },

    on_input:function (rs) {
        var self = this;
        this.models.member.find_oauth(rs.req_props.service, rs.req_props.user.id, function (err, member) {
            if (member) {
                rs.send({
                    service:rs.req_props.service,
                    member:member
                })
            } else {
                self.on_process(rs, rs.req_props.service, rs.req_props.user);
            }
        })
    },

    on_process:function (rs, service, user) {
        var self = this;
        var member = {
            member_name:user.name,
            oauth:[
                {
                    service:service,
                    id:user.id,
                    metadata:user
                }
            ]

        };
        this.models.member.add(member, function (err, nm) {
            if (err) {
                self.on_process_error(rs, err);
            } else if (nm) {
                rs.send({
                    service:service,
                    user:user,
                    member:member
                })
            } else {
                self.on_process_error(rs, 'cannot add ' + service + ' member ' + util.inspect(user));
            }
        })
    },

    on_error:function (rs, err) {
        console.log('rs: ', rs);
        var service = rs.req_props ? rs.req_props.service : ''
        rs.send({
            service:service,
            error:err,
            member:false,
            user:rs.req_props.user
        })
    }

}