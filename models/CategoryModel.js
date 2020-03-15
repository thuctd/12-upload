/**
 * Created by hoangnd on 8/10/17.
 */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    created_date: {
        type: Date,
        default: Date.now
    }
});
// a setter
CategorySchema.path('name').set((inputString) => {
    return inputString[0].toUpperCase() + inputString.slice(1);
});
module.exports = mongoose.model('Category', CategorySchema);