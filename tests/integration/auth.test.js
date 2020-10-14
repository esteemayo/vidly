const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');

describe('/api/auth', () => {
    let server;
    let user;
    let name;
    let email;
    let password;

    const exec = () => {
        return request(server)
            .post('/api/auth')
            .send({ name, email, password });
    }

    beforeEach(async () => {
        server = require('../../app');

        user = new User({
            name: '12345',
            email: 'test@example.com',
            password: '12345'
        });
        await user.save();

        name = '12345';
        email = 'test@example.com';
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
        email = new Array(257).join('a');

        const res = await exec();

        expect(res.status).toBe(400);
    });
    
    it('should return 400 if user password is less than 5', async () => {
        password = '1234';

        const res = await exec();

        expect(res.status).toBe(400);
    });
    
    it('should return 400 if user password is more than 1024', async () => {
        password = new Array(1030).join('a');

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 400 if user is not found', async () => {
        const res = await exec();

        const user = await User.findOne({ email: 'someone@example.com' });

        expect(res.status).toBe(400);
        expect(user).not.toBeDefined();
    });

});