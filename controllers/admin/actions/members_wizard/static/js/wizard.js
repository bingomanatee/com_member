$(function () {

    var wiz = new NE_WIZARD.Wizard();

    wiz.load_step = function (order) {
        if (!order) {
            order = this.current_order;
        }
        // console.log('loading step ', this.current_order);
        var step = this.step();
        switch (order) {

            case 1:
                wiz.show_buttons('next');
                if (!facebook_fields_loaded) {
                    _init_facebook_app_fields(step);
                }
                facebook_fields_changed = false; // note - this inidcates change FROM THE LAST VISIT. always reset at visit.
                break;

            case 2:
                wiz.show_buttons('first', 'prev');
                $('input', step).val('');
                _validate_user_form(false, true);
                $.post('/admin/member/init_wizard/2', {phase:"load"}, function (data) {
                    if (data.state) {
                        old_admin_user = data.state;
                        _alert_admin_member(data.state);
                        wiz.show_buttons(2, 'first', 'prev', 'next');
                    }
                    if (!admin_member_initialized) {
                        _init_admin_member(step);
                    }
                });
                break;

            case 3:
                wiz.show_buttons('first', 'prev');
                break;
        }
    }

    wiz.leave_step = function (cb, order, next_order) {
        var step = this.step(order);
        switch (order) {

            case 1:
                if (!facebook_fields_changed) {
                    return cb(true);
                }

                _save_facebook_data(step, cb)
                break;

            case 2:
                if (next_order < 2) {
                    return cb(true);
                }

                _save_admin_member(step, cb);
                break;

            case 3:
                cb(true);
                break;
        }
        return false;
    }

    wiz.load('#members_wizard', 'member_init');


    /* ************* STATE FLAGS *********************** */

    var facebook_fields_loaded = false;
    var admin_member_initialized = false;
    var facebook_fields_changed = false;
    var old_admin_user = false;
    var skip_save_admin = false;

    /* ************* FORM INITIALIZATION ***************** */

    function _init_admin_member(step) {
        if (!admin_member_initialized){

            $('.skip_admin_save', step).on('click', function(){
                skip_save_admin = true;
                wiz.paginate(3);
                return false;
            }).css("width", "auto").css("padding-right", "3em");
            admin_member_initialized = true;
        }
        if (_member_form_is_valid){
            if (old_admin_user){
                $('.controls button.next', step).text('Add Another Admin');
                $('.skip_admin_save', step).show().css('visibility', 'visible');
            } else {
                $('.controls button.next', step).text('Save Admin Member');
                $('.skip_admin_save', step).hide();
            }
        }
    }

    function _init_facebook_app_fields(step) {
        facebook_fields_loaded = true;
        $('input[name=fb_app_id]', step).val(WIZARD_SETTINGS.fb.fb_app_id);
        $('input[name=fb_app_secret]', step).val(WIZARD_SETTINGS.fb.fb_app_secret);
        $('input[name=fb_domain]', step).val(WIZARD_SETTINGS.fb.fb_domain);
        $('input', step).on('change', _on_edit_fb_data);
    }

    function _on_edit_fb_data() {
        facebook_fields_changed = true;
    }

    var _alert_admin_user_content = _.template('There is already an adimin user: <%= member_name %> (<%= real_name %>). You can create another user, but you do not have to to continue');

    function _alert_admin_member(old_user) {
        wiz.add_message({title:'Admin User Created', type:'good',
            content:_alert_admin_user_content(old_user), fade:3500});

    }

    /* ******************* FORM VALIDATION ********************* */

    function _member_form_is_valid() {

        /**
         * This validates the member form on the client side ONLY.
         * @type {*}
         */
        var fd = $('#member_form', wiz.step(2)).serializeArray();
        var form_data = deserialize(fd);

        if (form_data.password && form_data.password2 && form_data.member_name && form_data.real_name) {

            if (form_data.password2 == form_data.password) {
                return {valid:true};
            } else {
                return {valid:false, error:'password mismatch'};
            }
        } else {
            return {valid:false, error:'missing fields'};
        }
    }

    function _validate_user_form(e, init) {
        //  console.log('_validate user form', init);
        var fd = $('#member_form', wiz.step(2)).serializeArray();
        var form_data = deserialize(fd);
        wiz.show_button(2, 'next', false);
        _clear_timeout('missing_fields');
        _clear_timeout('password_mismatch');

        /**
         * note - this is a hybrid client/server validation.
         * The client validates the completeness of fields, and the server
         * validates that you are creating a unique user.
         */

        var form_state = _member_form_is_valid();

        if (form_state.valid) {
            var member = _member_form_data();
            $.post('/admin/member/init_wizard/2', {member:member, phase:"validation"}, function (data) {
                // console.log('err member data', data);
                wiz.show_button(2, 'next', !data.error);
                if (data.error) {
                    wiz.add_message({title:data.error.title, content:data.error.message, type:'error', fade:3000});
                }
            })
        } else {
            switch (form_state.error) {
                case 'password mismatch':
                    if (!init)  timeout_context.password_mismatch = setTimeout(_mismatch_password_message, 1000);
                    break;

                case 'missing fields':
                    if (!init)  timeout_context.missing_fields = setTimeout(_missing_fields_message, 6000);
                    break;

            }
        }

    }

    function _mismatch_password_message() {
        wiz.add_message({title:'Mismatched Passwords', type:'normal', content:'your first and second passwords must be the same', fade:2500});
        _clear_timeout('password_mismatch');
    }

    function _missing_fields_message() {
        wiz.add_message({title:'Please fill out all four form fields.', type:'normal', content:'Would you kindly...', fade:2500});
        _clear_timeout('missing_fields')
    }

    function _clear_timeout(key) {
        if (timeout_context[key]) {
            clearTimeout(timeout_context[key]);
            timeout_context[key] = false;
        }
    }

    var timeout_context = {
        password_mismatch:false,
        missing_fields:false
    };

    /* *********************** DATA SAVING METHODS ************** */

    function _member_form_data() {
        return  deserialize($('#member_form', wiz.step(2)).serializeArray());
    }

    function _save_admin_member(step, cb) {
        var member_data = _member_form_data();
        console.log('saving admin member: ', member_data);

        $.post('/admin/member/init_wizard/2', {member:member_data, phase:'save'}, function (data) {
            console.log('saved member data: ', data);

            wiz.add_message({title:'Saving Admin User &quot;' + member_data.member_name + '&quot;', content:'this is the user you will use to administer the site. Better remember their password', type:'good', fade:2500})
            cb(true);
        });
    }

    function _save_facebook_data(step, cb) {
        var data = {
            options:{
                fb_app_id:$('input[name=fb_app_id]', step).val(),
                fb_app_secret:$('input[name=fb_app_secret]', step).val(),
                fb_domain:$('input[name=fb_domain]', step).val()
            }
        }

        $.post('/admin/member/init_wizard/1',
            data, function (res) {
                // @TODO update fields from return data?

                if (res.success) {
                    wiz.add_message({title:'Facebook Information Saved', type:'good', content:'Your facebook App information has been saved.', fade:3000});
                    cb(true);
                } else {
                    wiz.add_message({title:'Problem Saving Facebook Information', type:'error', content:_fb_err_msg(res), fade:0});
                    cb(false);
                }
            }
        )
    }

    function _fb_err_msg(res) {

        var c = res.error;
        if (_.isObject(c)) {
            if (c.message) {
                c = c.message;
            } else {
                c = JSON.stringify(c);
            }
        }
        c += "<br /> Try again maybe?"
        return c;
    }
})