const express = require('express');
const Fawn = require('fawn');
const mongoose = require('mongoose');

const { Rental, validateRental } = require('../models/Rental');
const { Movie } = require('../models/Movie');
const { Customer } = require('../models/Customer');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');
const validate = require('../middleware/validate');

const router = express.Router();

Fawn.init(mongoose);

router.get('/', auth, async (req, res) => {
    const rentals = await Rental
        .find()
        .select('-__v')
        .sort('-dateOut');

    res.send(rentals);
});

router.get('/:id', [auth, validateObjectId], async (req, res) => {
    const rental = await Rental.findById(req.params.id).select('-__v');
    
    if (!rental) return res.status(404).send('The rental with the given ID was not found.');

    res.send(rental);
});

router.post('/', [auth, validate(validateRental)], async (req, res) => {
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer.');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie.');

    if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock.');

    const rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    });
    // rental = await rental.save();

    // movie.numberInStock--;
    // movie.save();

    try {
        new Fawn.Task()
            .save('rentals', rental)
            .update('movies', { _id: movie._id }, {
                $inc: { numberInStock: -1 }
            })
            .run();
    
        res.send(rental);
    } catch (ex) {
        res.status(500).send('Something failed.');
    }
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const rental = await Rental.findByIdAndRemove(req.params.id);

    if (!rental) return res.status(404).send('The rental with the given ID was not found.');

    res.send(rental);
});

module.exports = router;