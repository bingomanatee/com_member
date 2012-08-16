var NE = require('nuby-express');
var mm = NE.deps.support.mongoose_model;
var mongoose = NE.deps.mongoose;
var util = require('util');
var _ = require('underscore');

var oauth = new mongoose.Schema({
    id: String, // note - id, NOT _id - the id in the oauth system.
    source: {type: String, enum: ['twitter', 'facebook']},
    oauth_token: String,
    metadata: mongoose.Schema.Types.Mixed
})

var role_schema = new mongoose.Schema({
    name: String,
    tasks: [String]
});

var schema = new mongoose.Schema({
    real_name: String,
    user_name: {type: String, required: true, index: {unique: true}},
    auth: [oauth],
    meta_fields: mongoose.Schema.Types.Mixed, // note - these extra fields defined in fb_meta
    deleted: {type: Boolean, default: false},
    location: String,
    country: String,
    locale: String,
    email: String,
    bio: String,
    roles: [role_schema],
    admin_notes: String
});

schema.statics.active = function (cb) {
    return this.find('deleted', {'$ne':true}).run(cb);
}

schema.statics.inactive = function (cb) {
    return this.find('deleted', true).run(cb);
}

var _model = mm.create(schema,
    {name:"member", type:"model"}
);

module.exports = function () {
    return _model;
}
