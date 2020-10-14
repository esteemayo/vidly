const express = require('express');
const Joi = require('joi');
const { Rental } = require('../models/Rental');
const { Movie } = require('../models/Movie');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
    
    if (!rental) return res.status(404).send('Rental not found.');

    if (rental.dateReturned) return res.status(400).send('Return already processed.');

    rental.return();
    await rental.save();

    await Movie.update({ _id: rental.movie._id }, {
        $inc: { numberInStock: 1 }
    });

    return res.send(rental);
});

function validateReturn(req) {
    const schema = Joi.object({
        customerId: Joi.string().required(),
        movieId: Joi.string().required()
    });

    return schema.validate(req);
}

// outer.post('/', auth, async (req, res) => {
//     if (!req.body.customerId) return res.status(400).send('customerId not provided.');
//     if (!req.body.movieId) return res.status(400).send('movieId not provided.');

//     const rental = await Rental.findOne({
//         'customer._id': req.body.customerId,
//         'movie._id': req.body.movieId
//     });
//     if (!rental) return res.status(404).send('Rental not found');

//     if (rental.dateReturned) return res.status(400).send('Return already processed');

//     rental.dateReturned = new Date();
//     const rentalDays = moment().diff(rental.dateOut, 'days');
//     rental.rentalFee = rentalDays * rental.movie.dailyRentalRate;

//     await rental.save();

//     await Movie.update({ _id: rental.movie._id }, {
//         $inc: { numberInStock: 1 }
//     });

//     return res.status(200).send(rental);
// });

module.exports = router;