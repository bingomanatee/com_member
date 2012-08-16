var MEMBER_API = {}

$(function () {

    var REST_ROOT = '/admin/member';

    /* ***************** HELPERS ******************** */

    /* ****************** MODEL ********************** */

    MEMBER_API.Member_Model = Backbone.Model.extend({
        defaults:{
            user_name:'',
            real_name:'',
            email: ''
        },
        urlRoot:REST_ROOT,
        idAttribute:'_id'
    })

    var Member_Coll = Backbone.Collection.extend({
        model:MEMBER_API.Member_Model
    })

    /* ******************* ROW VIEW *************** */

    var tmpl = $("#member_row_template").html();
 // console.log('mrt: ', tmpl);
    var row_tmpl = Handlebars.compile(tmpl);

    MEMBER_API.RowView = Backbone.View.extend({
        template:row_tmpl,
        tagName:'tr',
        render:function () {
            var h = this.template(this.model.toJSON());
 // console.log('r', h);
            this.$el.html(h);
            return this;
        },

        events:{
            'click button.edit':'edit_member',
            'mouseover td.id_value':'show_id',
            'mouseout td.id_value':'hide_id'
        },

        hide_id:function () {
            $('.full_id', this.$el).hide();
        },

        show_id:function () {
            $('.full_id', this.$el).show();
        },

        edit_member:function (n) {
 // console.log('edit menu: ', n, this, this.model);
            var mfv = new MEMBER_API.EditMemberForm({model:this.model});
            mfv.render();
        }

    })

    /* ****************** MAIN VIEW **************** */

    MEMBER_API.MembersListView = Backbone.View.extend({

        collection:new Member_Coll(),

        el:$("#member_list"),

        initialize:function () {
            var self = this;
            this.comp_value = 'user_name';
            this.collection.url = REST_ROOT;
            this.collection.comparator = function (opt) {
                return opt.get(self.comp_value);
            };
            this.update_coll(false);
        },

        _form_cordian:null,

        render:function () {

            var self = this;
            $('tbody', this.$el).empty();
            //    this.$el.removeClass();
            //  this.$el.addClass('comp_' + this.comp_field);
            /*  var filtered_models = _.filter(
             this.collection.models,
             function (m) {
             return self._filter_model(m);
             }
             ) */
 // console.log('coll: ', this.collection);
            this.collection.each(function (member) {
                var v = new MEMBER_API.RowView({
                    model:member
                });
                $('tbody.insert', self.$el).append(v.render().$el);
            }, this);


        },

        events:{
            'click button.add':'add_member',
            'click td.id_sort':'sort_by_id',
            'click td.user_name_sort':'sort_by_name'
        },

        sort_by_id:function () {
            this.comp_value = 'id';
            var self = this;
            this.update_coll(false)
        },


        sort_by_type:function () {
            this.comp_value = 'type';
            var self = this;
            this.update_coll(false)
        },


        sort_by_value:function () {
            this.comp_value = 'value';
            var self = this;
            this.update_coll(false)
        },


        sort_by_src:function () {
            this.comp_value = 'src';
            var self = this;
            this.update_coll(false)
        },


        sort_by_name:function () {
            this.comp_value = 'name';
            var self = this;
            this.update_coll(false)
        },


        _ct_form:false,

        add_member:function () {
            //   console.log('add member');
            if (!this._new_ct_form) {
                this._new_ct_form = new MEMBER_API.AddMemberForm({members_view:this}).render();
            }
            this._new_ct_form.show_dialog(true);
        },

        update_coll:function (no_fetch, callback) {
            var self = this;

            function _update() {
                self.collection.sort();
                if (callback) {
                    callback();
                } else {
                    self.render();
                }
            }

            if (no_fetch) {
                _update();
            } else {
                this.collection.fetch({success:_update});
            }
        }


    })

    /* -------------- FORMS VIEW ------------- */

    var ftmpl = $('#member_form_template').html();

    MEMBER_API.AddMemberForm = Backbone.View.extend({

        tagName:'div',

        el:$("#member_forms"),

        template:Handlebars.compile(ftmpl),

        render:function () {
            var self = this;
            var params = {forms:[]};

            this.model.forEach(function (member) {
                var form = _.find(params.forms, function (form) {
                    return (form.src == member.get('src')) && (form.class == member.get('class'));
                });

                var field = member.toJSON();

                if (form) {
                    form.fields.push(field);
                } else {
                    params.forms.push({src:member.get('src'), class:member.get('class'), fields:[field]});
                }
            });

            this.$el.html(this.template(params));

            $('form', this.$el).each(function (i, f) {
                $(f).submit(function (d) {
                //    console.log('submitting form ', d);
                    var data = _deserialize($(f).serializeArray());
                 //   console.log('data: ', data);
                    var context = {src:data.src, class:data.class};
                    delete data.src;
                    delete data.class;
                    _.each(data, function (value, key) {
                        var matches = members_view.collection.where({
                            src:context.src,
                            class:context.class,
                            name:key
                        });
                        if (matches.length > 0) {
                            matches[0].set('value', value);
                            matches[0].save();
                        }
                    });

                    members_view.update_coll();
                    return false;
                });
            });

            $('.accordion', this.$el).accordion();
        }

    })


    /* -------------- EDIT VIEW ------------- */

    MEMBER_API.role_checkbox = Handlebars.compile('<label><input type="checkbox" name="roles[]" value="{{ name }}" {{#if checked}} checked="checked" {{/if}}  /> {{ name }}</label>');


    MEMBER_API.EditMemberForm = Backbone.View.extend({
        el:$('#edit_member'),


        events:{
            //   'click button.delete':'delete_member',
            'click button.update':'update_member'
        },

        /*  delete_member:function (e) {
         var self = this;
         this.model.destroy({
         success:function () {
         members_view.update_coll(false, function () {
         $(self.$el).dialog('close');
         members_view.render();
         });
         }
         });
         this.show_dialog(false);
         return false;
         }, */

        update_member:function (e) {
            var fd = $('form', this.$el).serializeArray();
            var self = this;
            _fd_to_model(fd, this.model);

            this.model.save({}, {
                success:function () {
                    members_view.update_coll(true, function () {
                        self.show_dialog(false);
                        members_view.render();
                    });
                }
            });
            return false;
        },

        template:Handlebars.compile(
            $("#edit_member_form").html()),

        render:function () {
            var data = this.model.toJSON();
            this.$el.html(this.template(data));
            this.show_dialog(true);
            var self = this;

            $.getJSON('/admin/member_role', function(roles){
                $('.roles', self.$el).empty();
             ///   console.log('roles: ', roles);
                var member_roles = self.model.get('roles');
                console.log('member roles: ', member_roles);
                var mrn = _.pluck(member_roles, 'name');

                console.log('mrn: ', mrn);
                _.each(roles, function(role){
                    role.checked = _.include(mrn, role.name);
                    $('.roles', self.$el).append(MEMBER_API.role_checkbox(role));
                })
            })
            return this;
        },

        show_dialog:function (s) {
            if (s) {
                $(this.$el).dialog({title:"Edit Member", width:"40em"});
            } else {
                $(this.$el).dialog('close');
            }

        }

    })


    var members_view = new MEMBER_API.MembersListView();
    members_view.collection.fetch();
    members_view.render();

})