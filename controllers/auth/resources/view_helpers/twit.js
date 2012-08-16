var NE = require('nuby-express');
var _ = require('underscore');
var util = require('util');
var fs = require('fs');

var twit_app_id = null;
var twit_app_secret = null;
var twit_domain = null;

var twit_template = null;
var twit_template_text = null;

module.exports = {
    name:'member_reg',

    init:function (rs, input, cb) {

        function _loaded() {
            var ln = rs.action.get_config('layout_name');
 // console.log('ln: %s', ln)
            if (ln && (ln != 'empty')) {
                input.helpers.twit_data = {
                   app_id:twit_app_id,
                   app_secret:twit_app_secret,
                   domain:twit_domain
                };
            }
            cb();
        }

        if (!input.helpers) {
            input.helpers = {};
        }
        input.helpers.twit = function () {
            return twit_template({
                twit_app_id:twit_app_id,
                twit_app_secret:twit_app_secret,
                twit_domain:twit_domain
            })
        }
        if (!twit_app_id) {
            rs.action.models.cc_options.find({
                    src:"membership",
                    class:"COMPONENT"
                },
                function (err, opts) {
                    opts.forEach(function (opt) {
                        switch (opt.name) {
                            case 'twit_app_id':
                                twit_app_id = opt.value;
                                break;

                            case 'twit_domain':
                                twit_domain = opt.value;

                            case 'twit_app_secret':
                                twit_app_secret = opt.value;
                                break;
                        }
                    })

                    fs.readFile(__dirname + '/twit.html', 'utf8',
                        function (err, content) {
                            twit_template_text = content;
                            //console.log('template: %s', content);
                            twit_template = _.template(twit_template_text);
                            _loaded();
                        }
                    );
                });

        } else {

            _loaded();
        }
    }

};