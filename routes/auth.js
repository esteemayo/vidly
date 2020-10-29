const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const { User, validateAuthUser } = require('../models/User');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/', validate(validateAuthUser), async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');
    // if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();

    // res.send(_.pick(user, ['_id', 'name', 'email']));
    res.send(token);
});

router.patch('/updateMyPassword', auth, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(req.body.passwordCurrent, user.password))) 
        return res.status(400).send('Your current password is incorrect.');

    user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();

    // res.status(200).send(_.pick(user, ['_id', 'name', 'email']));
    const token = user.generateAuthToken();
    res
        .status(200).header('x-auth-token', token)
        .send(_.pick(user, ['_id', 'name', 'email']));
});

module.exports = router;