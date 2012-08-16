var ROLES_API = {t_str:{}};

$(function () {

    var REST_ROOT = '/admin/member_role';

    /* ***************** HELPERS ******************** */

    /* ****************** MODEL ********************** */

    ROLES_API.Roles_Model = Backbone.Model.extend({
        defaults:{
            name:'',
            tasks:[]
        },
        urlRoot:REST_ROOT,
        idAttribute:'_id'
    })

    var Roles_Coll = Backbone.Collection.extend({
        model:ROLES_API.Roles_Model
    })

    /* ******************* ROW VIEW *************** */

    var tmpl = $("#role_row_template").html();
    var row_tmpl = Handlebars.compile(tmpl);

    ROLES_API.RowView = Backbone.View.extend({
        template:row_tmpl,
        tagName:'tr',
        render:function () {
            var h = this.template(this.model.toJSON());
            //   console.log('r', h);
            this.$el.html(h);
            return this;
        },

        events:{
            'click button.edit':'edit_role',
            'mouseover td.id_value':'show_id',
            'mouseout td.id_value':'hide_id'
        },

        hide_id:function () {
            $('.full_id', this.$el).hide();
        },

        show_id:function () {
            $('.full_id', this.$el).show();
        },

        edit_role:function (n) {
            var mfv = new ROLES_API.EditRolesForm({model:this.model});
            mfv.render();
        }

    })

    /* ****************** MAIN VIEW **************** */

    ROLES_API.RolesView = Backbone.View.extend({

        collection:new Roles_Coll(),

        el:$("#role_list"),

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
            this.collection.each(function (role) {
                var v = new ROLES_API.RowView({
                    model:role
                });
                $('tbody.insert', self.$el).append(v.render().$el);
            }, this);


        },

        events:{
            'click button.add':'add_role',
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

        add_role:function () {
 // console.log('add role');
            if (!this._new_ct_form) {
                this._new_ct_form = new ROLES_API.AddRolesView({roles_view:this});
                this._new_ct_form.render();
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

    ROLES_API.t_str.ftmpl = $('#add-role-template').html();

    ROLES_API.AddRolesView = Backbone.View.extend({

        tagName:'div',

        el:$("#add_role"),

        template:Handlebars.compile(ROLES_API.t_str.ftmpl),

        show_dialog:function (s) {
            if (s) {
                $(this.$el).dialog({title:"Add Role", width:"40em"});
            } else {
                $(this.$el).dialog('close');
            }

        },

        render:function () {
            var self = this;

            this.$el.html(this.template({}));

            $('form', this.$el).each(function (i, f) {
                $(f).submit(function (d) {
                    var data = _deserialize($(f).serializeArray());
 // console.log('role data: ', data);
                    var m = new ROLES_API.Roles_Model(data);
                    m.save();
                    roles_view.collection.add(m);
                    roles_view.update_coll();
                    self.show_dialog(false);

                    $.getJSON('/admin/member_task', function (data) {
 // console.log('tasks: ', tasks);
                    })

                    return false;
                });
            });

        }

    })


    /* -------------- EDIT VIEW ------------- */

    ROLES_API.task_checkbox = Handlebars.compile('<label><input type="checkbox" name="tasks[]" value="{{ name }}" {{#if checked}} checked="checked" {{/if}}>{{ name }}</label>');
    ROLES_API.t_str.etmpl = $('#edit-role-template').html();
    ROLES_API.EditRolesForm = Backbone.View.extend({
        el:$('#edit_role'),

        initialize:function () {
 // console.log('editing ', this.model.toJSON());
        },

        template:Handlebars.compile(ROLES_API.t_str.etmpl),

        events:{
            'click button.delete':'delete_role',
            'click button.update':'update_role'
        },

        delete_role:function (e) {
            var self = this;
            this.model.destroy({
                success:function () {
                    roles_view.update_coll();
                    $(self.$el).dialog('close');
                }
            });
            this.show_dialog(false);
            return false;
        },

        update_role:function (e) {
            var fd = $('form', this.$el).serializeArray();
            var self = this;
 // console.log('form data: ', fd);
            _fd_to_model(fd, this.model);

            this.model.save({}, {
                success:function () {
                    roles_view.update_coll(true, function () {
                        self.show_dialog(false);
                        roles_view.update_coll();
                    });
                }
            });
            return false;
        },

        render:function () {
            var self = this;
            var data = this.model.toJSON();
            this.$el.html(this.template(data));
            this.show_dialog(true);
            $.getJSON('/admin/member_task', function (tasks) {
 // console.log('tasks: ', tasks);
                var checked = self.model.get('tasks');

                _.each(tasks, function (task) {
                    if(_.contains(checked, task.name)){
                        task.checked = true;
                    } else {
                        task.checked = false;
                    }
                    $('.tasks', self.$el).append(ROLES_API.task_checkbox(task));
                })
            })
            return this;
        },

        show_dialog:function (s) {
            if (s) {
                $(this.$el).dialog({title:"Add Configuration", width:"40em"});
            } else {
                $(this.$el).dialog('close');
            }

        }

    })


    var roles_view = new ROLES_API.RolesView();
    roles_view.collection.fetch();
    roles_view.render();

})