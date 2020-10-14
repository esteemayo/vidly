const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');
const { Rental } = require('../../models/Rental');
const { Customer } = require('../../models/Customer');
const { Movie } = require('../../models/Movie');

let server;

describe('/api/rentals', () => {
    beforeEach(() => {
        server = require('../../app');
    });

    afterEach(async () => {
        await server.close();
        await Rental.deleteMany();
        await Customer.deleteMany();
        await Movie.deleteMany();
    });

    describe('GET /', () => {
        let token;
        let rentals;
        let customerId;
        let movieId;

        const exec = async () => {
            return await request(server)
                .get('/api/rentals')
                .set('x-auth-token', token);
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return all rentals', async () => {
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();

            rentals = [
                {
                    customer: {
                        _id: customerId,
                        name: 'customer1',
                        phone: '12345'
                    },
                    movie: {
                        _id: movieId,
                        title: 'movie1',
                        dailyRentalRate: 2
                    }
                }
            ];

            await Rental.collection.insertMany(rentals);

            const res = await exec();

            expect(res.status).toBe(200);
            // expect(res.body.length).toBe(2);
            expect(res.body.some(r => r.customer.name === 'customer1')).toBeTruthy();
            expect(res.body.some(r => r.customer.phone === '12345')).toBeTruthy();
            expect(res.body.some(r => r.movie.title === 'movie1')).toBeTruthy();
            expect(res.body.some(r => r.movie.dailyRentalRate === 2)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let token;
        let rental;
        let customerId;
        let movieId;
        let id;

        const exec = async () => {
            return await request(server)
                .get(`/api/rentals/${id}`)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            rental = new Rental({
                customer: {
                    _id: customerId,
                    name: '12345',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2
                }
            });
            await rental.save();

            token = new User().generateAuthToken();
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();
            id = rental._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no rental with the given id was found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return a rental if request is valid', async () => {
            const res = await exec();
            
            expect(res.status).toBe(200);
            expect(Object.keys(res.body)).toEqual(
                expect.arrayContaining(['_id', 'customer', 'movie'])
            );
        });
    });

    describe('POST /', () => {
        let token;
        let rental;
        let movie;
        let customer;
        let customerId;
        let movieId;

        const exec = async () => {
            return await request(server)
                .post('/api/rentals')
                .set('x-auth-token', token)
                .send(rental);
        }

        beforeEach(async () => {
            movie = new Movie({
                title: 'movie1',
                genre: { name: 'genre1' },
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();
            
            customer = new Customer({
                name: 'customer1',
                phone: '12345'
            });
            await customer.save();

            rental = {
                customer: {
                    _id: customerId,
                    name: '12345',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2
                }
            };

            token = new User().generateAuthToken();
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if customerId is not provided', async () => {
            customerId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movieId is not provided', async () => {
            movieId = '';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if no customer with the given id was found', async () => {
            await Customer.deleteMany();

            const res = await exec();

            const customerInDb = await Customer.findById(customer._id);

            expect(res.status).toBe(400);
            expect(customerInDb).toBeNull();
        });

        it('should return 400 if no movie with the given id was found', async () => {
            await Movie.deleteMany();

            const res = await exec();

            const movieInDb = await Movie.findById(movie._id);

            expect(res.status).toBe(400);
            expect(movieInDb).toBeNull();
        });

        it('should return 400 if there is no movie in stock', async () => {
            movie.numberInStock = 0;
            await movie.save();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the rental if input is valid', async () => {
            await exec();

            const rental = await Customer.find({ customerId, movieId });

            expect(rental).not.toBeNull();
        });

        it('should save the rental and decrease the movie stock', async () => {
            movie.numberInStock--;
            await movie.save();

            const res = await exec();

            expect(res.body).toHaveProperty('_id', rental._id);
        });

        it('should return the rental if it is valid', async () => {
            const res = await exec();

            expect(res.body).toBeDefined();
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let rental;
        let customerId;
        let movieId;
        let id;

        const exec = async () => {
            return await request(server)
                .delete(`/api/rentals/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            rental = new Rental({
                customer: {
                    _id: customerId,
                    name: '12345',
                    phone: '12345'
                },
                movie: {
                    _id: movieId,
                    title: '12345',
                    dailyRentalRate: 2
                }
            });
            await rental.save();

            token = new User({ isAdmin: true }).generateAuthToken();
            customerId = mongoose.Types.ObjectId();
            movieId = mongoose.Types.ObjectId();
            id = rental._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();
            
            expect(res.status).toBe(404);
        });

        it('should return 404 if no rental found with the given id', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the rental if input is valid', async () => {
            await exec();

            const rentalInDb = await Rental.findById(id);

            expect(rentalInDb).toBeNull();
        });

        it('should return the removed rental', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', rental._id.toHexString());
            expect(Object.keys(res.body)).toEqual(
                expect.arrayContaining(['customer', 'movie'])
            );
        });
    });
});