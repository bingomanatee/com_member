var tap = require('tap');
var util = require('util');
var _ = require('underscore');
var mock_jq = require('./mock_jq');
var member = require('./../actions/support/static/js/member');
var NE = require('nuby-express');

tap.test('join with no params', function (t) {

    var join_action = _.extend({
        on_post_input_error:function (rs, err) {
            console.log('error: %s', util.inspect(err));
            t.equal(err, join_action._msg.no_pass_fb);
            t.end();
        },
        on_post_validate_error:function (rs, err) {
            t.fail('reached on_post_validate_error');
            t.end();
        }
    }, require('./../actions/join/join_action'));
    var rs = new NE.Req_State_Mock(join_action, {

    });
    join_action.on_post_input(rs);


});

/**
 * This test refleects a model error in finding a match for a given facebook member.
 */
tap.test('join with facebook - error retrieving fb member', function (t) {

    var _no_fb_error = 'error retrieving %s member with id %s';

    var join_action = _.extend({models:{
        member:{
            find_oauth:function (service, id, cb) {
                console.log('test: service %s, id %s', service, id);
                cb(new Error(util.format(_no_fb_error, service, id)));
            }
        }

    },
        on_post_input_error:function (rs, err) {
            t.fail('on_post_input_error reached');
            t.end();
        },
        on_post_validate_error:function (rs, err) {
            console.log('error: %s', util.inspect(err));
            t.equal(err.message, util.format(_no_fb_error, 'facebook', 100), 'pv v error for join with facebook');
            t.end();
        }
    }, require('./../actions/join/join_action'));
    var rs = new NE.Req_State_Mock(join_action, {
        req_props:{
            facebook_data:JSON.stringify({
                id:100,
                name:'Bob'
            })
        }

    });

    join_action.on_post_input(rs);


});

/**
 * This test reflects a member joining with an ouath user block for facebook
 */
tap.test('join with facebook - joining with facebook oauth user data', function (t) {

    var _no_fb_error = 'error retrieving %s member with id %s';
    var new_member_id = 'aaabbb';
    var oauth_user = {
        id:100,
        name:'Bob'
    };

    var join_action = _.extend({models:{
        member:{
            find_oauth:function (service, id, cb) {
                cb(null, null);
            },

            add:function (member, cb) {
                this.new_member = _.extend({_id:new_member_id}, member);
                cb(null, this.new_member);
            }
        }

    },
        on_post_input_error:function (rs, err) {
            t.fail('reached on_post_input_error');
            t.end();
        },
        on_post_validate_error:function (rs, err) {
            t.fail('reached on_post_validate_error');
            t.end();
        }
    }, require('./../actions/join/join_action'));

    var rs = new NE.Req_State_Mock(join_action, {
        req_props:{
            facebook_data:JSON.stringify(oauth_user)
        }

    });

    rs.go = function (dest) {
        t.equal(dest, '/', 'going to /');
        t.equal(join_action.models.member.new_member._id, new_member_id);
        t.equal(join_action.models.member.new_member.member_name, oauth_user.name, 'new member added with oauth user name');
        t.end();
    }

    join_action.on_post_input(rs);


});

/**
 * This test reflects a member joining with an ouath user block for facebook
 * this time a member name is in req_props
 */
tap.test('join with facebook - joining with facebook oauth user data', function (t) {

    var _no_fb_error = 'error retrieving %s member with id %s';
    var new_member_id = 'aaabbb';
    var oauth_user = {
        id:100,
        name:'Bob'
    };
    var member_name = "John"

    var join_action = _.extend({models:{
        member:{
            find_oauth:function (service, id, cb) {
                cb(null, null);
            },

            add:function (member, cb) {
                this.new_member = _.extend({_id:new_member_id}, member);
                cb(null, this.new_member);
            }
        }

    },
        on_post_input_error:function (rs, err) {
            t.fail('reached on_post_input_error');
            t.end();
        },
        on_post_validate_error:function (rs, err) {
            t.fail('reached on_post_validate_error');
            t.end();
        }
    }, require('./../actions/join/join_action'));

    var rs = new NE.Req_State_Mock(join_action, {
        req_props:{
            facebook_data:JSON.stringify(oauth_user), member_name:member_name
        }

    });

    rs.go = function (dest) {
        t.equal(dest, '/', 'going to /');
        t.equal(join_action.models.member.new_member._id, new_member_id);
        t.equal(join_action.models.member.new_member.member_name, member_name, 'new member added with oauth user name');
        t.end();
    }

    join_action.on_post_input(rs);
});
/**
 * This test reflects a member without oauth but with name and password
 * this time a member name is in req_props
 */
tap.test('join without oauth', function (t) {

    var _no_fb_error = 'error retrieving %s member with id %s';
    var new_member_id = 'aaabbb';
    var member_name = "John";
    var password = "pass";

    var join_action = _.extend({models:{
        member:{
            find_oauth:function (service, id, cb) {
                cb(null, null);
            },

            add:function (member, cb) {
                this.new_member = _.extend({_id:new_member_id}, member);
                cb(null, this.new_member);
            }
        },
        cc_options:{
            get_option:function (key, cb) {
                options = {};
                cb(null, options[key])
            }
        }
    },
        on_post_input_error:function (rs, err) {
            t.fail('reached on_post_input_error');
            t.end();
        },
        on_post_validate_error:function (rs, err) {
            t.fail('reached on_post_validate_error');
            t.end();
        }
    }, require('./../actions/join/join_action'));

    var rs = new NE.Req_State_Mock(join_action, {
        req_props:{
            facebook_data:'',
            member_name:member_name,
            password:password,
            password2:password
        }
    });

    rs.go = function (dest) {
        t.equal(dest, '/', 'going to /');
        t.equal(join_action.models.member.new_member._id, new_member_id);
        t.equal(join_action.models.member.new_member.member_name, member_name, 'new member added with oauth user name');
        t.end();
    }

    join_action.on_post_input(rs);
});