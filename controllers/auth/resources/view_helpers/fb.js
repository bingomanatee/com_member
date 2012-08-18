var NE = require('nuby-express');
var _ = require('underscore');
var util = require('util');
var fs = require('fs');

var fb_app_id = null;
var fb_app_secret = null;
var fb_member_meta_fields = null;
var fb_domain = null;

var reg_template_text = null;
var reg_template = null;
var fb_template_text = null;
var fb_template = null;

module.exports = {
    name:'member_reg',

    init:function (rs, input, cb) {
        if (!input.helpers) {
            input.helpers = {};
        }

        function _loaded(){

            input.helpers.fb_data = {
                app_id:fb_app_id,
                app_secret:fb_app_secret,
                domain:fb_domain
            };

            input.helpers.member_reg = function () {
                return reg_template({
                    fb_app_id:fb_app_id,
                    fb_app_secret:fb_app_secret,
                    fb_member_meta_fields:fb_member_meta_fields,
                    fb_domain:fb_domain
                });
            }

            input.helpers.fb = function () {
                return fb_template({
                    fb_app_id:fb_app_id,
                    fb_app_secret:fb_app_secret,
                    fb_member_meta_fields:fb_member_meta_fields,
                    fb_domain:fb_domain
                })
            }
            cb();
        }
        if (!fb_app_id) {
            rs.action.models.cc_options.find({
                    src:"auth",
                    class:"CONTROLLER"
                },
                function (err, opts) {
                    opts.forEach(function (opt) {
                        switch (opt.name) {
                            case 'fb_app_id':
                                fb_app_id = opt.value;
                                break;

                            case 'fb_domain':
                                fb_domain = opt.value;

                            case 'fb_member_meta_fields':
                                fb_member_meta_fields = opt.value;
                                break;

                            case 'fb_app_secret':
                                fb_app_secret = opt.value;
                                break;
                        }
                    })
                    fs.readFile(__dirname + '/reg.html', 'utf8',
                        function (err, content) {
                            reg_template_text = content;
                            //console.log('template: %s', content);
                            reg_template = _.template(reg_template_text);

                            fs.readFile(__dirname + '/fb.html', 'utf8',
                                function (err, content) {
                                    fb_template_text = content;
                                    //console.log('template: %s', content);
                                    fb_template = _.template(fb_template_text);


                                    _loaded();
                                }
                            );
                        }
                    );
                });

        } else {

            _loaded();
        }
    }

};