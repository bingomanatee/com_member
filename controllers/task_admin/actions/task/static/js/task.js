var TASKS_API = {t_str: {}};

$(function () {

    var REST_ROOT = '/admin/member_task';

    /* ***************** HELPERS ******************** */

    /* ****************** MODEL ********************** */

    TASKS_API.Tasks_Model = Backbone.Model.extend({
        defaults:{
            name:''
        },
        urlRoot:REST_ROOT,
        idAttribute:'_id'
    })

    var Tasks_Coll = Backbone.Collection.extend({
        model:TASKS_API.Tasks_Model
    })

    /* ******************* ROW VIEW *************** */

    var tmpl = $("#task_row_template").html();
    var row_tmpl = Handlebars.compile(tmpl);

    TASKS_API.RowView = Backbone.View.extend({
        template:row_tmpl,
        tagName:'tr',
        render:function () {
            var h = this.template(this.model.toJSON());
         //   console.log('r', h);
            this.$el.html(h);
            return this;
        },

        events:{
            'click button.edit':'edit_task',
            'mouseover td.id_value':'show_id',
            'mouseout td.id_value':'hide_id'
        },

        hide_id:function () {
            $('.full_id', this.$el).hide();
        },

        show_id:function () {
            $('.full_id', this.$el).show();
        },

        edit_task:function (n) {
            var mfv = new TASKS_API.EditTasksForm({model:this.model});
            mfv.render();
        }

    })

    /* ****************** MAIN VIEW **************** */

    TASKS_API.TasksView = Backbone.View.extend({

        collection:new Tasks_Coll(),

        el:$("#task_list"),

        initialize:function () {
            var self = this;
            this.comp_value = 'name';
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
             )        console.log('coll: ', this.collection);
             */

            this.collection.each(function (task) {
                var v = new TASKS_API.RowView({
                    model:task
                });
                $('tbody.insert', self.$el).append(v.render().$el);
            }, this);


        },

        events:{
            'click button.add':'add_task',
            'click td.id_sort':'sort_by_id',
            'click td.member_name_sort':'sort_by_name'
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

        add_task:function () {
 // console.log('add task');
            if (!this._new_ct_form) {
                this._new_ct_form = new TASKS_API.AddTasksView({tasks_view:this});
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

    TASKS_API.t_str.ftmpl = $('#add-task-template').html();

    TASKS_API.AddTasksView = Backbone.View.extend({

        tagName:'div',

        el:$("#add_task"),

        template:Handlebars.compile(TASKS_API.t_str.ftmpl),

        show_dialog:function (s) {
            if (s) {
                $(this.$el).dialog({title:"Add Task", width:"40em"});
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
 // console.log('task data: ', data);
                    var m = new TASKS_API.Tasks_Model(data);
                    m.save();
                    tasks_view.collection.add(m);
                    tasks_view.update_coll();
                    self.show_dialog(false);
                    return false;
                });
            });

        }

    })


    /* -------------- EDIT VIEW ------------- */

    TASKS_API.t_str.etmpl = $('#edit-task-template').html();
    TASKS_API.EditTasksForm = Backbone.View.extend({
        el:$('#edit_task'),


        template:Handlebars.compile(TASKS_API.t_str.etmpl),

        events:{
            //   'click button.delete':'delete_task',
            'click button.update':'update_task'
        },

        /*  delete_task:function (e) {
         var self = this;
         this.model.destroy({
         success:function () {
         tasks_view.update_coll(false, function () {
         $(self.$el).dialog('close');
         tasks_view.render();
         });
         }
         });
         this.show_dialog(false);
         return false;
         }, */

        update_task:function (e) {
            var fd = $('form', this.$el).serializeArray();
            var self = this;
 // console.log('form data: ', fd);
            _fd_to_model(fd, this.model);

            this.model.save({}, {
                success:function () {
                    tasks_view.update_coll(true, function () {
                        self.show_dialog(false);
                        tasks_view.render();
                    });
                }
            });
            return false;
        },

        render:function () {
            var data = this.model.toJSON();
            this.$el.html(this.template(data));
            this.show_dialog(true);
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


    var tasks_view = new TASKS_API.TasksView();
    tasks_view.collection.fetch();
    tasks_view.render();

})