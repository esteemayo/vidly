const express = require('express');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const { User, validateAuthUser } = require('../models/User');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/', validate(validateAuthUser), async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');
    // if (!user || (!await bcrypt.compare(req.body.password, user.password))) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();

    // res.send(_.pick(user, ['_id', 'name', 'email']));
    res.send(token);
});

module.exports = router;