var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var path = require('path');
var NE = require('nuby-express');

/* ***************** CLOSURE ************* */

/* ***************** MODULE *********** */

module.exports = {

    /* *************** GET RESPONSE METHODS ************** */

    on_get_validate:function (rs) {
        this.on_get_input(rs);
    },

    on_get_input:function (rs) {
        this.on_get_process(rs, rs.req_props);
    },

    on_get_process:function (rs, input) {
        this.on_output(rs, input);
    },

    /* *************** POST RESPONSE METHODS ************** */

    on_post_validate:function (rs) {
        if (!rs.has_content('signed_request')) {
            this.on_post_validate_error(rs, 'No signed request');
        } else {
            this.on_post_input(rs);
        }
    },

    on_post_input:function (rs) {
        var self = this;

        var options_model = this.models.cc_options;
        options_model.find_one({name:'fb_app_secret'}, function (err, opt) {
            if (err) {
                self.on_post_input_error(rs, err);
            } else if (opt && opt.value) {
                var fb_secret = opt.value;
                if (self.FB) {
                    var signedRequest = self.FB.parseSignedRequest(rs.req_props.signed_request, fb_secret);
 // console.log('signed request', util.inspect(signedRequest));


                    self.on_post_process(rs, signedRequest);
                } else {
                    self.on_post_process_error(rs, 'no FB');
                }
            } else {
                if (opt) {
 // console.log('opt: ', util.inspect(opt));
                }
                self.on_post_input_error(rs, 'no FB secret set');
            }
        });

    },
    /*
     signed request { algorithm: 'HMAC-SHA256',
     expires: 1341644400,
     issued_at: 1341638199,
     oauth_token: 'AAAGzosF6M8ABABqT6PVqi2sZCn57JAu8ucgJuZC0ZBY8KicL937diUuU9P6n5Af7fTDQRDfb3fs2m7IredN8nb16gvGHFZB90K4qUZCGnHwZDZD',
     registration:
     { name: 'Dave Edelhart',
     email: 'bingomanatee@me.com',
     bio: 'foo',
     admin_bio: 'bar' },
     registration_metadata: { fields: '[{\'name\':\'name\'}, {\'name\':\'email\'}, {name: \'bio\', description: \'your public biography\', \'type\': \'text\' }, {\'name\': \'admin_bio\', \'type\': \'text\', \'description\': \'bio for site owner - only visible to the site owner\'}]' },
     user: { country: 'us', locale: 'en_US' },
     user_id: '805008941' }
     */

    on_post_process:function (rs, signedRequest) {
        var self = this;

        var member_model = this.models.member;
 // console.log('signedRequest.registration: %s', util.inspect(signedRequest.registration));



        var member_record = {
            real_name:signedRequest.registration.name,
            user_name:signedRequest.registration.name, // generally FB names == real names
            bio:signedRequest.registration.bio,
            email:signedRequest.registration.email,
            auth:[
                {
                    id:signedRequest.user_id,
                    source:'facebook',
                    oauth_token:signedRequest.oauth_token
                }
            ]
        };

        var user = false;

        if (signedRequest.user){
            user = signedRequest.user;
        } else if (signedRequest.registration.user) {
            user = signedRequest.registration.user;
        }

        if (user){
            _.extend(member_record, user);
        }

       member_model.find_one({"auth.id":signedRequest.user_id }, function(err, old_member){
           if (old_member){
               rs.flash('info', 't.already_registered')
                rs.go('/?message=t.already_registered');
           } else {
               member_model.put(member_record, function (err, m) {
                   if (err) {
                       self.on_post_process_error(rs, err);
                   } else if (m) {
 // console.log('member saved: ', util.inspect(m));
                       rs.go('/');
                   } else {
                       self.on_post_process_error(rs, {member: false});
                   }
               })
           }
       });

    },

    _on_post_error_go:true

}