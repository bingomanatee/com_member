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

        if (!rs.has('member')) {
            this.on_validate_error(rs, 'no data for service or user');
        } else  {
            this.on_input(rs)
        }
    },

    on_input:function (rs) {
        this.on_process(rs, rs.req_props.member);
    },

    on_process:function (rs, member) {
        if (member){

        }
    },

    _on_error_go: true

}