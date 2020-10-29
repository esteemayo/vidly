const mongoose = require('mongoose');
const Joi = require('joi');
const { genreSchema } = require('./Genre');

const Movie = mongoose.model('Movie', new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 255
    },
    genre: {
        type: genreSchema,
        required: true
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}));

function validateMovie(movie) {
    const schema = Joi.object({
        title: Joi.string().trim().min(5).max(255).required().label('Title'),
        // genreId: Joi.objectId().required(),
        genre: Joi.object().required().label('Genre'),
        numberInStock: Joi.number().min(0).max(255).required(),
        dailyRentalRate: Joi.number().min(0).max(255).required()
    });

    return schema.validate(movie);
}

exports.Movie = Movie;
exports.validateMovie = validateMovie;