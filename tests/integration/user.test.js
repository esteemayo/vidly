const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');

describe('/api/users', () => {
    let server;
    let user;
    let name;
    let email;
    let password;

    const exec = () => {
        return request(server)
            .post('/api/users')
            .send(user);
    }

    beforeEach(() => {
        server = require('../../app');

        user = { 
            name, 
            email, 
            password 
        };
        
        name = 'testUser';
        email = 'someone@example.com';
        password = '12345';
    });

    afterEach(async () => {
        await server.close();
        await User.deleteMany();
    });

    it('should return 400 if user name is less than 5', async () => {
        name = '1234';
        
        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user name is more than 50', async () => {
        name = new Array(53).join('a');

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user email is less than 5', async () => {
        email = '1234';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user email is more than 255', async () => {
        email = new Array(259).join();

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user password is less than 5', async () => {
        password = '1234';

        const res = await exec();
        
        expect(res.status).toBe(400);
    });

    it('should return 400 if user password is more than 1024', async () => {
        password = new Array(1029).join('a');

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user already registered', async () => {
        const user = new User({
            name: 'newUser',
            email: 'test@example.com',
            password: '12345'
        });
        await user.save();

        const res = await request(server).post('/api/users');

        const userInDb = await User.findOne({ email: 'test@example.com' });

        // expect(userInDb).toBeDefined();
        expect(res.status).toBe(400);
    });
});