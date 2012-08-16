var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

/* ***************** CLOSURE ************* */

function _privs(j) {
    var privs = [];
    if (j.roles && _.isArray(j.roles)) {
        privs = _.reduce(j.roles, function (local_privs, role) {
            if (role.tasks) {
                return local_privs.concat(role.tasks);
            }
            return local_privs;
        }, []);
    }
    j.privs = privs;
    return privs;
}

/* ***************** MODULE *********** */

module.exports = {

    model:function () {
        return this.models.member;
    },

    /* *************** RESPONSE METHODS ************** */

    on_validate:function (rs) {
        var self = this;
        switch (rs.req_props.service) {
            case 'facebook':
                this.on_input(rs);
                break;

            case 'twitter':
                this.on_input(rs);
                break;

            default:
                this.on_get_error(rs, new Error('bad service'));
        }
    },

    TICKS_PER_MINUTE:60000,

    _session_member:function (rs) {

        if ((!rs.req_props.id) || (rs.req_props.id == '0')){
            rs.clear_session('member');
            return false;
        }

        var member_data = rs.session('member');

        if (member_data) {
            var auth = _.find(member_data.auth, function (a) {
                return (a.id == rs.req_props.id) && (a.source == rs.req_props.service);
            });

            if (auth) {
                var t = new Date().getTime();
                var d = t - member_data.time;

                if (d < 120) {
                    return member_data;
                }
            } else {
                rs.clear_session('member');
                return false;
            }
        } else {

            rs.clear_session('member');
            return false;
        }
    },

    on_input:function (rs) {
        var self = this;

       // console.log('mid action: %s ---------------------------------------------------------------------------------',
        //    rs.req_props.id);

        if ((!rs.req_props.id) || (rs.req_props.id == '0')){
            console.log('clearing member session =================================');
            rs.clear_session('member');
            rs.send({logged_out: true});
            return false;
        }

        var member_data = this._session_member(rs);
        if (member_data) {
            console.log('sending local member data %s', util.inspect(member_data));
            return rs.send(member_data);
        }

        this.model().find_one({"auth.source":rs.req_props.service, "auth.id":rs.req_props.id}, function (err, member) {
            if (err) {
                self.on_get_error(rs, err);
            } else {
                // console.log('found SERVICE %s MEMBER: %s', rs.req_props.service, util.inspect(member));
                self.on_process(rs, member);
            }
        })
    },

    /**
     * note - this action does two things: saves a complete member data object in session
     * and passes a slightly reduced member data object (sans IDs, oauth_tokens) out as a REST return.
     *
     * @param rs Req_State
     * @param member Mongoose doc
     */

    on_process:function (rs, member) {
        var self = this;
        var full_member = member.toJSON();
        full_member.time = new Date().getTime();

        var privs = _privs(full_member);

        rs.set_session('member', full_member);

        /**
         * note - shared member is the object returned via REST,
         * sans a few key fields for security.
         * @type {*}
         */

        var shared_member = member.toJSON();
        shared_member.time = new Date().getTime();
        shared_member.privs = privs;

        // console.log('j before filter: %s', util.inspect(j));
        delete shared_member._id;

        if (shared_member.auth) {
            shared_member.auth.forEach(function (auth_object) {
                delete auth_object.oauth_token;
            })
        }
        // console.log('j after filter: %s', util.inspect(j));

        rs.send(shared_member);
    },

    on_get_error:function (rs, err) {
        rs.clear_session('member');

        try {
            rs.send(_.isObject(err) ? err : {error:err});
        } catch (e) {
            rs.send({error:true});
        }
    },

    _on_get_error_go:true

}