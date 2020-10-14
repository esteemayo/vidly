const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');
const { Course } = require('../../models/Course');

let server;

describe('/api/courses', () => {
    beforeEach(() => {
        server = require('../../app');
    });

    afterEach(async () => {
        await server.close();
        await Course.deleteMany();
    });

    describe('GET /', () => {
        let token;

        const exec = async () => {
            return await request(server)
                .get('/api/courses')
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

        it('should return all courses', async () => {
            const courses = [
                { 
                    name: 'Python',
                    category: 'web',
                    author: 'John Doe',
                    tags: ['code', 'html', 'css'],
                    isPublished: true,
                    price: 20
                },
                { 
                    name: 'Node',
                    category: 'mobile',
                    author: 'Alice Doe',
                    tags: ['javascript', 'html', 'css'],
                    isPublished: false,
                    price: 15
                }
            ];

            await Course.collection.insertMany(courses);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(c => c.name === 'Python')).toBeTruthy();
            expect(res.body.some(c => c.name === 'Node')).toBeTruthy();
            expect(res.body.some(c => c.category === 'web')).toBeTruthy();
            expect(res.body.some(c => c.category === 'mobile')).toBeTruthy();
            expect(res.body.some(c => c.author === 'John Doe')).toBeTruthy();
            expect(res.body.some(c => c.author === 'Alice Doe')).toBeTruthy();
            expect(res.body.some(c => c.isPublished === true)).toBeTruthy();
            expect(res.body.some(c => c.isPublished === false)).toBeTruthy();
            expect(res.body.some(c => c.price === 20)).toBeTruthy();
            expect(res.body.some(c => c.price === 15)).toBeTruthy();
            expect(res.body).toBeDefined();
        });
    });

    describe('GET /:id', () => {
        let token;
        let course;
        let id;

        const exec = async () => {
            return await request(server)
                .get(`/api/courses/${id}`)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            course = new Course({ 
                name: 'course1', 
                category: 'web', 
                author: 'author1', 
                tags: ['tag1', 'tag2'], 
                isPublished: false, 
                price: 12 
            });
            await course.save();

            token = new User().generateAuthToken();
            id = course._id;
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

        it('should return 404 if no course with the given id ', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return a course if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', course.name);
            expect(res.body).toHaveProperty('category', course.category);
            expect(res.body).toHaveProperty('author', course.author);
            expect(res.body).toHaveProperty('tags', ['tag1', 'tag2']);
            expect(res.body).toHaveProperty('isPublished', course.isPublished);
            expect(res.body).toHaveProperty('price', course.price);
        });
    });

    describe('POST /', () => {
        // Define the happy path, and then in each test, we change 
        // one parameter that clearly aligns with the name of the 
        // test.
        let token;
        let name;
        let category;
        let author;
        let tags;
        let isPublished;
        let price;

        const exec = async () => {
            return await request(server)
                .post('/api/courses')
                .set('x-auth-token', token)
                .send({ name, category, author, tags, isPublished, price });
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'course1';
            category = 'web';
            author = 'author1';
            tags = ['tag1', 'tag2'];
            isPublished = true;
            price = 12;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';
            
            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if course name is less than 5 characters', async () => {
            name = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course name is more than 255 characters', async () => {
            name = new Array(259).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course price is less than 10', async () => {
            price = 9;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course price is more than 200', async () => {
            price = 300;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the course if it is valid', async () => {
            await exec();

            const course = await Course.find({ name: 'course1' });

            expect(course).not.toBeNull();
        });

        it('should return the course if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'course1');
            expect(res.body).toHaveProperty('category', 'web');
            expect(res.body).toHaveProperty('author', 'author1');
            expect(res.body).toHaveProperty('tags', ['tag1', 'tag2']);
            expect(res.body).toHaveProperty('isPublished', true);
            expect(res.body).toHaveProperty('price', 12);
        });
    });

    describe('PUT /:id', () => {
        let token;
        let course;
        let newName;
        let newCategory;
        let newAuthor;
        let newtags;
        let newIsPublished;
        let newPrice;
        let id;

        const exec = async () => {
            return await request(server)
                .put(`/api/courses/${id}`)
                .set('x-auth-token', token)
                .send({ name: newName, category: newCategory, author: newAuthor, tags: newtags, isPublished: newIsPublished, price: newPrice });
        }

        beforeEach(async () => {
            // Before each test we need to create a course and 
            // put it in the database.
            course = new Course({ name: 'course1', category: 'web', author: 'author1', tags: ['tag1', 'tag2'], isPublished: false, price: 12 });
            await course.save();

            token = new User().generateAuthToken();
            id = course._id;
            newName = 'updatedName';
            newCategory = 'category';
            newAuthor = 'updatedAuthor';
            newtags = ['tag1', 'tag2'];
            newIsPublished = false;
            newPrice = 27;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if course name is less than 5 characters', async () => {
            newName = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course name is more than 255 characters', async () => {
            newName = new Array(259).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course price is less than 10', async () => {
            newPrice = 9;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if course price is more than 200', async () => {
            newPrice = 300;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if customer with the given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the customer if input is valid', async () => {
            await exec();

            const updatedCourse = await Course.findById(course._id);

            expect(updatedCourse.name).toBe(newName);
            expect(updatedCourse.category).toBe(newCategory);
            expect(updatedCourse.author).toBe(newAuthor);
            expect(updatedCourse.tags).toEqual(expect.arrayContaining(['tag1', 'tag2']));
            expect(updatedCourse.isPublished).toBe(newIsPublished);
            expect(updatedCourse.price).toBe(newPrice);
        });

        it('should return the updated course if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
            expect(res.body).toHaveProperty('category', newCategory);
            expect(res.body).toHaveProperty('author', newAuthor);
            expect(res.body).toHaveProperty('tags', newtags);
            expect(res.body).toHaveProperty('isPublished', newIsPublished);
            expect(res.body).toHaveProperty('price', newPrice);
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let course;
        let id;

        const exec = async () => {
            return await request(server)
                .delete(`/api/courses/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            course = new Course({ name: 'course1', category: 'web', author: 'author1', tags: ['tag1', 'tag2'], isPublished: false, price: 12 });
            await course.save();

            token = new User({ isAdmin: true }).generateAuthToken();
            id = course._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if the user is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no course with the given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();
            
            expect(res.status).toBe(404);
        });

        it('should delete the course if input is valid', async () => {
            await exec();

            const courseInDb = await Course.findById(id);

            expect(courseInDb).toBeNull();
        });

        it('should return the removed course', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', course._id.toHexString());
            expect(res.body).toHaveProperty('name', course.name);
            expect(res.body).toHaveProperty('category', course.category);
            expect(res.body).toHaveProperty('author', course.author);
            expect(res.body).toHaveProperty('tags', ['tag1', 'tag2']);
            expect(res.body).toHaveProperty('isPublished', course.isPublished);
            expect(res.body).toHaveProperty('price', course.price);
        });
    });
});


