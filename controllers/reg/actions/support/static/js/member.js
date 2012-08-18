if (typeof module !== 'undefined') {
    var _ = require('underscore');
    var util = require('util');
}

var _DEBUG = true;

(function (root) {

    function NE_MEMBER(jquery) {
        if (jquery) {
            this.set_jquery(jquery);
        }
    }

    _.extend(NE_MEMBER.prototype, {

        _jquery:null,

        set_jquery:function (j) {
            this._jquery = j;
        },

        get_jquery:function () {
            return this._jquery ? this._jquery : $;
        },

        get_local_member:function () {
            return this.get_cookie();
        },

        _loading_user_status:false,

        auth_change:function (response) {
            if (_DEBUG)  console.log('auth_change:', response);

            if (response.status == 'connected') {
                this.reflect_oauth_user('facebook', response.authResponse.userID)
            } else {
                this.reflect_no_oauth_user();
            }
        },

        local_member_has_oauth_id:function (service, id) {
            var member = this.get_local_member();

            if (!member) {
                var out = false;
            } else {
                var out = _.any(member.oauth, function (oauth) {
                    return ((oauth.service == service) && (oauth.id == id));
                }) ? true : false;
            }

            if (_DEBUG) console.log('local member has oauth id: ' + service + '/' + id + ': ' + (out ? 'true' : 'false'))

            return out
        },

        get_cookie:function () {
            var cookie = this.get_jquery().cookie('member', {path:'/'});
            if (_.isString(cookie) && cookie) {
                cookie = JSON.parse(cookie);
            }
            return cookie;
        },

        set_cookie:function (member) {
            if (_.isObject(member)) {
                member = JSON.stringify(member);
            }
            if (member) {
                if (_DEBUG) console.log('setting cookie to ' + member);
                this.get_jquery().cookie('member', member, {path:'/'});
            } else {
                if (_DEBUG) console.log('unsetting setting cookie');
                this.get_jquery().removeCookie('member', {path:'/'});
            }
        },

        set_local_member:function (member) {
            this.set_cookie(member);
            this.reflect_member(member);
        },

        reflect_member:function (member) {
            if (arguments.length == 0) {
                member = this.get_local_member();
            }

            var body = this.get_jquery()('body');

            if (_DEBUG) console.log('triggering body with member ' + (member? JSON.stringify(member) : 'false'));
            body.trigger('member', member);
        },

        unset_local_member:function () {
            this.set_cookie(false);
            this.reflect_member(null);
        },

        register_oauth_user:function (service, user, cb) {
            if (_DEBUG) console.log('registering ' + service + ' user ' + JSON.stringify(user) )
            this.get_jquery().post('/add_oauth_user', {
                service:service,
                user:user
            }, cb);
        },

        /**
         * attempt to pull data from NE site. if you can't,
         * pull it from facebook.
         *
         * @param service: String -- 'facebook' or 'twitter'
         * @param id: Number
         * @param cb: function (optional) -- recipient
         */
        get_site_member_from_oauth:function (service, id, cb) {
            var url = '/member_from_oauth/' + service + '/' + id;
            this.get_jquery().get(url, cb);
        },

        member_has_oauth_service:function (service) {
            var member = this.get_local_member();
            if (!member) {
                return false;
            }
            var has_service = false;

            return _.any(member.oauth, function (o) {
                return o.service == service;
            });
        },

        member_is_only_facebook:function (member) {
            if (!member) {
                member = this.get_local_member();
            }
            if (!member) {
                throw new Error('no member to test member_is_only_facebook on')
            }

            if (this.member_has_oauth_service('facebook')) {
                if (!member.password) {
                    return true;
                } else if (member.password == 'facebook') {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }

        },

        init_facebook:function () {
            //    console.log('getting login status');
            var self = this;
            FB.Event.subscribe('auth.authResponseChange', _.bind(this.auth_change, this));
            FB.getLoginStatus();
        },

        reflect_no_oauth_user:function () {
            var member = this.get_local_member();

            if (member) {
                if (this.member_is_only_facebook(member)) {
                    //  console.log('member is a pure facebook member - log them off')
                    this.unset_local_member();
                } else {
                    this.reflect_member(member);
                }
            } else {
                //  console.log('member logged off - reflect that')
                this.reflect_member(false);
            }
        },

        get_oauth_member_from_service: function(service, id, cb){
            switch (service){
                case 'facebook':
                    FB.api('/me',cb);
                    break;

                default:
                    throw new Error('cannot get auth memember from ' + service);
            }
        },
        /**
         *
         FB.api('/me/picture', function (pic) {

         // console.log('me: ', response, 'pic', pic);
         response.url = pic;
         var ut = Handlebars.compile('<div class="li_user clearfix"><img src="{{url}}" style="float: left; margin-right: 0.5em;"/' +
         '>Welcome <br />{{name }} <br clear="all" /></div>');
         $('#fb-user').html(ut(response));

         })


         * @param service
         * @param id
         */

        reflect_oauth_user:function (service, id) {
            var self = this;
            if (this.local_member_has_oauth_id(service, id)) {
                // already logged in
                this.reflect_member();
            } else {
                // already registered
                this.get_site_member_from_oauth(service, id, function(data){
                    if (data.member){
                        self.set_local_member(data.member);
                    } else {
                        // logged in via oauth in but not registered - should be rare.
                       self.get_oauth_member_from_service(service, id, function(user){
                           if (user){
                               self.register_oauth_user(service, user, function(member){
                                   self.reflect_member(member);
                               })

                           }
                       })
                    }
                });
            }
        }
    });

    if (typeof module !== 'undefined') {
        module.exports = NE_MEMBER;
    } else if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = NE_MEMBER;
        }
        exports.NE_MEMBER = NE_MEMBER;
    } else {
        root['NE_MEMBER'] = new NE_MEMBER($);
    }

})(this);