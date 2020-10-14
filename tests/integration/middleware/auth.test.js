const request = require('supertest');
const { User } = require('../../../models/User');
const { Genre } = require('../../../models/Genre');

let server;

describe('auth middleware', () => {
    beforeEach(() => { server = require('../../../app'); });
    afterEach(async () => { 
        await server.close();
        await Genre.deleteMany();
    });

    // Let's send a request to an endpoint that requires authorization
    // it could be any endpoint, let's say genres endpoint

    let token;

    const exec = () => {
        return request(server)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: 'genre1' });
    }

    beforeEach(() => {
        token = new User().generateAuthToken();
    });

    it('should return 401 if no token is provided', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return 400 if token is invalid', async () => {
        token = 'a';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('should return 200 if token is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });
});