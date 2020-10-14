const mongoose = require('mongoose');
const Joi = require('joi');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true,
        minlength: 5,
        maxlength: 50
    }
});

const Genre = mongoose.model('Genre', genreSchema);

// function validateGenre(genre) {
//     const schema = {
//         name: Joi.string().required().max(50).min(5).label('Name')
//     };

//     return Joi.validate(genre, schema);
// }

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().required().max(50).min(5).label('Name')
    });

    return schema.validate(genre);
}

exports.genreSchema = genreSchema;
exports.Genre = Genre;
exports.validate = validateGenre;