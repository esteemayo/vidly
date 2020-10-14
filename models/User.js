const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minlength: 5,
        maxlength: 255
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    isAdmin: Boolean
});

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'));
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required().label('Name'),
        email: Joi.string().min(5).max(255).lowercase().required().email().label('Email'),
        password: Joi.string().min(5).max(1024).required().label('Password')
    });

    return schema.validate(user);
}

function validateAuthUser(user) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).lowercase().required().email().label('Email'),
        password: Joi.string().min(5).max(1024).required().label('Password')
    });

    return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;
exports.validateAuthUser = validateAuthUser;