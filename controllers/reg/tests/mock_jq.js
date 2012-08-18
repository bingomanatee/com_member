var tap = require('tap');
var util = require('util');
var _ = require('underscore');

var _DEBUG = true;

var _jquery_methods = {

    add_service_user:function (service, user) {
        if (!this._service_data[service]) {
            throw new Error('cannot get service data from %s', service);
        }
        //   console.log('adding service member to %s', util.inspect(this));
        // console.log('adding service data %s, %s', service, util.inspect(member));
        this._service_data[service].push(user);
    },

    add_site_member:function (member) {
        //   console.log('adding service member to %s', util.inspect(this));
        // console.log('adding service data %s, %s', service, util.inspect(member));
        this._site_members.push(member);
    },

    // returns a boolean function that determines
    // if the member has an ouath record with service, id params.

    _is_service_user:function (service, id) {
        return function (item) {
            return _.any(item.oauth, function (o) {
                return (o.id == id) && (o.service == service);
            })
        }
    },

    get:function (url, cb) {
        //   console.log('getting URL: %s', url);
        var match = new RegExp('^/member_from_oauth/([^/]*)/(.*)$').exec(url);
        if (match) {
            var service = match[1];
            var id = parseInt(match[2]);
            var site_data = this._site_members;

            var member = _.find(site_data, this._is_service_user(service, id));
            cb({member:member});
        } else {
            cb({member:false});
        }
    },

    post:function (url, data, cb) {
        switch (url) {
            case '/add_oauth_user':
                    var existing_member = _.find(this._site_members, this._is_service_user(data.service, data.user.id));
                    if (existing_member){
                        cb({member: existing_member});
                    } else {
                        var new_member = {
                            _id: Math.random() + 'fff',
                            user_name: data.user.name,
                            oauth: [{
                                service: data.service,
                                id: data.user.id,
                                metadata: data.user
                            }]
                        }
                        this._site_members.push(new_member);
                        cb({member: new_member});
                    }

                break;

            default:
                cb(null);
        }
    },

    get_cookie:function (what) {

        var out = null;
        if (this._cookies.hasOwnProperty(what)) {
            out = this._cookies[what];
        }

        return out;
    },

    cookie:function (what, value, options) {

        if (!what) {
            throw new Error('cookies called without key');
        }

        if (_.isObject(value)) {
            options = value;
            var out = this.get_cookie(what);

            return out;
        }

        if (_.isUndefined(value)) {
            var out = this.get_cookie(what);

            return out;
        } else {

            this._cookies[what] = value;
            return value;
        }
    },

    removeCookie:function (key) {
        if (this._cookies.hasOwnProperty(key)) {
            delete(this._cookies[key]);
        }
    }
}


module.exports = function () {
    var jQuery = function (key) {
        if (key) {
            return jQuery._fake_elements[key];
        }
    };


    jQuery._service_data = {facebook:[], twitter:[]};
    jQuery._cookies = {};
    jQuery._messages = [];
    jQuery._site_members = [];
    var self = this;
    jQuery._fake_elements = {body:{
        trigger:function (message, content) {
            jQuery._messages.push({message:message, content:content});
        }
    }};

    _.extend(jQuery, _jquery_methods);

    return jQuery;

}