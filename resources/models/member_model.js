var NE = require('nuby-express');
var mm = NE.deps.support.mongoose_model;
var mongoose = NE.deps.mongoose;
var util = require('util');
var _ = require('underscore');

var oauth = new mongoose.Schema({
    id:String, // note - id, NOT _id - the id in the oauth system.
    service:{type:String, enum:['twitter', 'facebook']},
    oauth_token:String,
    metadata:mongoose.Schema.Types.Mixed
})

var role_schema = new mongoose.Schema({
    name:String,
    tasks:[String]
});

var schema = new mongoose.Schema({
    real_name:String,
    member_name:{type:String, required:true, index:{unique:true}},
    oauth:[oauth],
    meta_fields:mongoose.Schema.Types.Mixed, // note - these extra fields defined in fb_meta
    deleted:{type:Boolean, default:false},
    location:String,
    country:String,
    locale:String,
    email:String,
    public_profile:String,
    private_profile: String,
    roles:[role_schema],
    admin_notes:String
});

schema.statics.active = function (cb) {
    return this.find('deleted', {'$ne':true}).run(cb);
}

schema.statics.inactive = function (cb) {
    return this.find('deleted', true).run(cb);
}

var _model = mm.create(schema,
    {name:"member",
        type:"model",
        find_oauth:function (service, id, cb) {
            console.log('finding %s %s', service, id);
            this.find({'oauth.service':service, 'oauth.id':id }, function (err, members) {
                console.log('found %s, %s', util.inspect(err), util.inspect(members));
                if (err) {
                    cb(err);
                } else {
                    var matched_members = _.filter(members, function(m){
                       var match = false;

                        _.each(m.oauth, function(o){
                            if (o.service == service && o.id == id){
                                match = true;
                            }
                        });
                        return match;
                    })

                    if (matched_members.length){
                        cb(null, matched_members[0]);
                    } else {
                        cb(null, false);
                    }
                }
            })
        }
    }
);

module.exports = function () {
    return _model;
}
