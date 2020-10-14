const express = require('express');
const _ = require('lodash');

const { Course, validate } = require('../models/Course');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    const courses = await Course
    .find()
    .sort({ name: 1 });

    res.send(courses);
});

router.get('/:id', [auth, validateObjectId], async (req, res) => {
    const course = await Course.findById(req.params.id);

    if(!course) return res.status(404).send('The course with the given ID was not found.');

    res.send(course);
});

router.post('/', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let course = new Course(_.pick(req.body, ['name', 'category', 'author', 'tags', 'isPublished', 'price']));
    course = await course.save();

    res.send(course);
});

router.put('/:id', [auth, validateObjectId], async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });

    if(!course) return res.status(404).send('The course with the given ID was not found.');

    res.send(course);
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const course = await Course.findByIdAndRemove(req.params.id);

    if(!course) return res.status(404).send('The course with the given ID was not found.')

    res.send(course);
});

module.exports = router;