var tap = require('tap');
var util = require('util');
var _ = require('underscore');
var mock_jq = require('./mock_jq');
var member = require('./../actions/support/static/js/member');

tap.test('basic cookie i/o', function (t) {

    t.equals(null, null, 'null is null');

    var jQuery = mock_jq();
    var NE_MEMBER = new member(jQuery);

    var start_cookie = NE_MEMBER.get_cookie();

    t.equals(start_cookie, null, 'cookie starts out as null');
    var oauth = {
        service:'facebook',
        id:100, metadata:{
            id:100, name:'Test User'
        }
    };

    var test_member = {user_name:'Test User', oauth:[oauth]};

    NE_MEMBER.set_cookie(test_member);

    t.deepEqual(NE_MEMBER.get_cookie(), test_member, 'cookie has new user');
    t.ok(NE_MEMBER.local_member_has_oauth_id('facebook', 100), 'cookie user has id 100');

    NE_MEMBER.set_cookie();

    t.equals(start_cookie, null, 'cookie reset to null');

    t.end();
});


tap.test('getting member by oauth key', function (t) {

    var jQuery = mock_jq();
    var NE_MEMBER = new member(jQuery);
    var oauth = {
        service:'facebook',
        id:100, metadata:{
            id:100, name:'Test User'
        }
    };

    var test_member = {user_name:'Test User', oauth:[oauth]};
    jQuery.add_service_user('facebook', oauth);
    jQuery.add_site_member(test_member);

    NE_MEMBER.get_site_member_from_oauth('facebook', 100, function (data) {
        t.deepEqual(data.member, test_member, 'retrieved test member from mock backend');
        t.end();
    })

});

tap.test('add service member', function (t) {

    var jQuery = mock_jq();
    var NE_MEMBER = new member(jQuery);
    var oauth = {
        service:'facebook',
        id:100, metadata:{
            id:100, name:'Test User'
        }
    };

    var test_member = {user_name:'Test User', oauth:[oauth]};
  //  jQuery.add_site_member('facebook', test_member);

    NE_MEMBER.set_local_member(test_member);
    t.deepEqual(NE_MEMBER.get_cookie(), test_member, 'cookie has new user');
    // console.log(jQuery);
    t.equal(jQuery._messages.length, 1, 'member message in jquery');
    t.deepEqual(jQuery._messages[0].content, test_member, 'message has test member');

    t.end();
});

tap.test('reflect_oauth_user', function (t) {
    // see if we can get the oauth user from cookie without going through service

    var jQuery = mock_jq();
    console.log('jquery: %s', util.inspect(jQuery));
    var NE_MEMBER = new member(jQuery);
    var oauth = {
        service:'facebook',
        id:100, metadata:{
            id:100, name:'Test User'
        }
    };

    var test_member = {user_name:'Test User', oauth:[oauth]};

  //  jQuery.add_service_member('facebook', test_member);

    NE_MEMBER.set_cookie(test_member);

    NE_MEMBER.reflect_oauth_user('facebook', 100);
    t.equal(jQuery._messages.length, 1, 'member message 1 in jquery');
    t.deepEqual(jQuery._messages[0].content, test_member, 'message has test member');

    var oauth2 = {
        service:'facebook',
        id:200, metadata:{
            id:200, name:'Test User 2'
        }
    };

    var test_member_2 = {user_name:'Test User 2', oauth:[oauth2]};
    jQuery.add_service_user('facebook', oauth2);
    jQuery.add_site_member(test_member_2);

    NE_MEMBER.get_site_member_from_oauth('facebook', 200, function(data){
        t.deepEqual(data.member, test_member_2);
        t.end();
    });
    
});

tap.test('register_oauth_user', function (t) {

    var jQuery = mock_jq();
    console.log('jquery: %s', util.inspect(jQuery));
    var NE_MEMBER = new member(jQuery);
    var user = {
        id:100, name:'Test User'
    };
    var oauth = {
        service:'facebook',
        id:100, metadata: user
    };

    var test_member = {user_name:'Test User', oauth:[oauth]};

    NE_MEMBER.register_oauth_user('facebook', user, function(data){
        t.equal(data.member.user_name, user.name, 'registered member has same name as oauth');
        t.end();
    })
});


