const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');
const { Movie } = require('../../models/Movie');
const { Genre } = require('../../models/Genre');

let server;

describe('/api/movies', () => {
    beforeEach(() => {
        server = require('../../app');
    });

    afterEach(async () => {
        await server.close();
        await Movie.deleteMany();
    });

    describe('GET /', () => {
        let token;

        const exec = async () => {
            return await request(server)
                .get('/api/movies')
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

        it('should return all movies', async () => {
            const movies = [
                {
                    title: 'movie1',
                    genre: {
                        name: 'genre1'
                    },
                    numberInStock: 5,
                    dailyRentalRate: 2
                },
                {
                    title: 'movie2',
                    genre: {
                        name: 'genre2'
                    },
                    numberInStock: 9,
                    dailyRentalRate: 3
                }
            ];

            await Movie.collection.insertMany(movies);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(m => m.title === 'movie1')).toBeTruthy();
            expect(res.body.some(m => m.title === 'movie2')).toBeTruthy();
            expect(res.body.some(m => m.genre.name === 'genre1')).toBeTruthy();
            expect(res.body.some(m => m.genre.name === 'genre2')).toBeTruthy();
            expect(res.body.some(m => m.numberInStock === 5)).toBeTruthy();
            expect(res.body.some(m => m.numberInStock === 9)).toBeTruthy();
            expect(res.body.some(m => m.dailyRentalRate === 2)).toBeTruthy();
            expect(res.body.some(m => m.dailyRentalRate === 3)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let token;
        let movie;
        let id;

        const exec = async () => {
            return await request(server)
                .get(`/api/movies/${id}`)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            movie = new Movie({
                title: 'movie1',
                genre: {
                    name: 'genre1'
                },
                numberInStock: 5,
                dailyRentalRate: 2
            });
            await movie.save();

            token = new User().generateAuthToken();
            id = movie._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if invalid id is passed', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no movie with the given id exist', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return a movie if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', movie.title);
            expect(res.body).toHaveProperty('genre.name', movie.genre.name);
            expect(res.body).toHaveProperty('numberInStock', movie.numberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', movie.dailyRentalRate);
        });
    });

    describe('POST /', () => {
        let token;
        let title;
        let genre;
        // let name;
        let numberInStock;
        let dailyRentalRate;
        let genreId;
        let id;

        const exec = async () => {
            return await request(server)
                .post('/api/movies')
                .set('x-auth-token', token)
                .send({ title, genre, numberInStock, dailyRentalRate });
        }

        beforeEach(async () => {
            genreId = mongoose.Types.ObjectId();

            genre = new Genre({
                _id: genreId,
                name: '12345'
            });
            await genre.save();
            
            token = new User().generateAuthToken();
            title = 'movie1';
            // genre = { _id: genreId, name: 'genre1' };
            numberInStock = 5;
            dailyRentalRate = 2;
            id = genreId;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';
            
            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if movie title is less than 5 characters', async () => {
            title = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie title is more than 255 characters', async () => {
           title = new Array(257) .join('a');

           const res = await exec();

           expect(res.status).toBe(400);
        });

        it('should return 400 if movie numberInstock is less than 0', async () => {
            numberInStock = -1;

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if movie numberInStock is more than 255', async () => {
            numberInStock = 257;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie dailyRentalRate is less than 0', async () => {
            dailyRentalRate = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie dailyRentalRate is more than 255', async () => {
            dailyRentalRate = 257;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if invalid genre id is passed', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            const genreInDb = await Genre.findById(id);

            expect(genreInDb).toBeNull();
        });

        it('should save the movie if it is valid', async () => {
            await exec();

            const movie = await Movie.find({ title: 'movie1' });

            expect(movie).not.toBeNull();
        });

        it('should return the movie if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'movie1');
            expect(res.body).toHaveProperty('genre.name', '12345');
            expect(res.body).toHaveProperty('numberInStock', 5);
            expect(res.body).toHaveProperty('dailyRentalRate', 2);
        });
    });

    describe('PUT /:id', () => {
        let token;
        let movie;
        let genre;
        let newTitle;
        let newNumberInStock;
        let newDailyRentalRate;
        let genreId;
        let id;

        const exec = async () => {
            return await request(server)
                .put(`/api/movies/${id}`)
                .set('x-auth-token', token)
                .send({ title: newTitle, genre, numberInStock: newNumberInStock, dailyRentalRate: newDailyRentalRate });
        }
        
        beforeEach(async () => {
            genreId = mongoose.Types.ObjectId();

            movie = new Movie({
                title: 'movie1',
                genre: {
                    id: genreId,
                    name: 'genre1'
                },
                numberInStock: 5,
                dailyRentalRate: 2
            });
            await movie.save();
            
            token = new User().generateAuthToken();
            newTitle = 'newMovie';
            genre = movie.genre;
            newNumberInStock = 3;
            newDailyRentalRate = 5;
            id = movie._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if movie title is less than 5 characters', async () => {
            newTitle = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie title is more than 255 characters', async () => {
           newTitle = new Array(257) .join('a');

           const res = await exec();

           expect(res.status).toBe(400);
        });

        it('should return 400 if movie numberInstock is less than 0', async () => {
            newNumberInStock = -1;

            const res = await exec();
            
            expect(res.status).toBe(400);
        });

        it('should return 400 if movie numberInStock is more than 255', async () => {
            newNumberInStock = 257;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie dailyRentalRate is less than 0', async () => {
            newDailyRentalRate = -1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie dailyRentalRate is more than 255', async () => {
            newDailyRentalRate = 257;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if movie with the id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the movie if input is valid', async () => {
            await exec();

            const updatedMovie = await Movie.findById(movie._id);

            expect(updatedMovie.title).toBe(newTitle);
            // expect(updatedMovie.genre).toMatchObject(genre);
            expect(updatedMovie.numberInStock).toBe(newNumberInStock);
            expect(updatedMovie.dailyRentalRate).toBe(newDailyRentalRate);
        });

        it('should return the updated movie if it is valid', async () => {
            const res = await exec();
            
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', newTitle);
            expect(res.body).toHaveProperty('genre._id', genre._id.toHexString());
            expect(res.body).toHaveProperty('genre.name', genre.name);
            expect(res.body).toHaveProperty('numberInStock', newNumberInStock);
            expect(res.body).toHaveProperty('dailyRentalRate', newDailyRentalRate);
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let movie;
        let genreId;
        let id;

        const exec = async () => {
            return await request(server)
                .delete(`/api/movies/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            genreId = mongoose.Types.ObjectId();
            
            movie = new Movie({
                title: 'movie1',
                genre: {
                    id: genreId,
                    name: 'genre1'
                },
                numberInStock: 5,
                dailyRentalRate: 2
            });
            await movie.save();

            token = new User({ isAdmin: true }).generateAuthToken();
            id = movie._id;
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

        it('should return 404 if no movie with the given id was found', async () => {
            // id = mongoose.Types.ObjectId();

            // const res = await exec();

            // expect(res.status).toBe(404);
        });

        it('should delete the movie if input is valid', async () => {
            await exec();

            const movieInDb = await Movie.findById(id);

            expect(movieInDb).toBeNull();
        });

        it('should return the removed movie', async () => {
            const res = await exec();

            expect(Object.keys(res.body)).toEqual(
                expect.arrayContaining([ '_id', 'title', 'genre', 'numberInStock', 'dailyRentalRate'])
            );

            // expect(res.body).toHaveProperty('_id', movie._id.toHexString());
            // expect(res.body).toHaveProperty('title', movie.title);
            // expect(res.body).toHaveProperty('genre._id', movie.genre._id.toHexString());
            // expect(res.body).toHaveProperty('genre.name', movie.genre.name);
            // expect(res.body).toHaveProperty('numberInStock', movie.numberInStock);
            // expect(res.body).toHaveProperty('dailyRentalRate', movie.dailyRentalRate);
        });
    });
});