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
        if (!rs.has_content('service', 'id')){
            return this.on_validate_error(rs, 'missing required properties');
        }

        switch (rs.req_props.service) {
            case 'facebook':
                this.on_input(rs);
                break;

            case 'twitter':
                this.on_input(rs);
                break;

            default:
                this.on_validate_error(rs, 'bad service');
        }
    },

    TICKS_PER_MINUTE:60000,

    on_input:function (rs) {
        var self = this;

        var member = rs.session('member');
        if (member) {
            if (_.filter(member.oauth, function(item){
                return item.source == rs.req_props
            }).length > 0){
                return rs.send(member);
            }
        }

        console.log('finding oauth %s, %s', util.inspect(rs.req_props.service, rs.req_props.id));
        this.model().find_oauth(rs.req_props.service, rs.req_props.id, function (err, member) {
            console.log('... result = %s, %s', util.inspect(err), util.inspect(member));
            if (err) {
                self.on_input_error(rs, err);
            } else if (member){
                self.on_process(rs, member);
            } else {
                rs.send({error: 'cannot find ' + rs.req_props.service + ' ' + rs.req_props.id, member: false})
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

    _session_member: function(rs, member){

        var full_member = member.toJSON();
        full_member.time = new Date().getTime();

        var privs = _privs(full_member);
        full_member.privs = privs;

        rs.set_session('member', full_member);
    },

    on_process:function (rs, member) {
        var self = this;
        this._session_member(rs, member);

        var shared_member = member.toJSON();
        shared_member.time = new Date().getTime();
        shared_member.privs =  _privs(member);;
        if (this.get_config('cloak_member_id_in_session')) delete shared_member._id;

        rs.send({member: shared_member});
    },

    _on_get_error_go:true

}