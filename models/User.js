const mongoose = require('mongoose');
const Joi = require('joi');
const crypto = require('crypto');
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
    isAdmin: Boolean,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'));
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

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