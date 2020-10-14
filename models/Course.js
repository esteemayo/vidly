const mongoose = require('mongoose');
const Joi = require('joi');

const Course = mongoose.model('Course', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 255
    },
    category: {
        type: String,
        required: true,
        enum: ['web', 'mobile', 'network'],
        lowercase: true,
        // uppercase: true,
        trim: true
    },
    author: String,
    tags: {
        type: Array,
        isAsync: true,
        validate: {
            validator: function(val) {
                return val && val.length > 0;
            },
            message: 'A course should have at least one tag.'
        }
    },
    date: {
        type: Date,
        default: Date.now()
    },
    isPublished: Boolean,
    price: {
        type: Number,
        required: function() {
            return this.isPublished;
        },
        min: 10,
        max: 200,
        get: val => Math.round(val),
        set : val => Math.round(val)
    }
}));

function validateCourse(course) {
    const schema = Joi.object({
        name: Joi.string().required().min(5).max(255).label('Name'),
        category: Joi.string().required().lowercase().trim().label('Category'),
        author: Joi.string().label('Author'),
        tags: Joi.array().required().label('Tags'),
        isPublished: Joi.boolean(),
        price: Joi.number().min(10).max(200).required().label('Price')
    });

    return schema.validate(course);
};

module.exports.Course = Course;
module.exports.validate = validateCourse;