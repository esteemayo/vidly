const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { User, validateUser } = require('../models/User');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/', validate(validateUser), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send('User already registered.');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    const token = user.generateAuthToken();
    
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});

router.post('/forgotPassword', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).send('There is no user with email address.');

    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and 
        passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, 
        please ignore this email.`;

    try {
        
        res.status(200).send(message);
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).send('There was an error sending the email. Try again later.');
    }
});

router.post('/resetPassword/:token', async (req, res) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).send('Token is invalid or has expired.');

    user.password = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).send(_.pick(user, ['_id', 'name', 'email']));
});

module.exports = router;