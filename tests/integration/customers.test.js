const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../../models/User');
const { Customer } = require('../../models/Customer');

let server;

describe('/api/customers', () => {
    beforeEach(() => {
        server = require('../../app');
    });

    afterEach(async () => {
        await server.close();
        await Customer.deleteMany();
    });

    describe('GET /', () => {
        let token;

        const exec = async () => {
            return await request(server)
            .get('/api/customers')
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

        it('should return all customers', async () => {
            const customers = [
                {
                    name: 'john',
                    phone: '12345',
                    isGold: false
                },
                {
                    name: 'mary',
                    phone: '12345',
                    isGold: true
                },
            ];

            await Customer.collection.insertMany(customers);

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(c => c.name === 'john')).toBeTruthy();
            expect(res.body.some(c => c.phone === '12345')).toBeTruthy();
            expect(res.body.some(c => c.isGold === false)).toBeTruthy();
            expect(res.body.some(c => c.isGold === true)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let token;
        let customer;
        let id;
        
        const exec = async () => {
            return await request(server)
                .get(`/api/customers/${id}`)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            customer = new Customer({
                name: 'john',
                phone: '12345',
                isGold: false
            });
            await customer.save();

            token = new User().generateAuthToken();
            id = customer._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return a customer if valid id is passed', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', customer.name);
        });

        it('should return 404 if invalid id is passed', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no customer with the given id exist', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();
            
            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        // Define the happy path, and then in each test, we change 
        // one parameter that clearly aligns with the name of the 
        // test. 
        let token;
        let name;
        let phone;
        let isGold;

        const exec = async () => {
            return await request(server)
                .post('/api/customers')
                .set('x-auth-token', token)
                .send({ name, phone, isGold });
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();
            name = 'customer1',
            phone = '12345',
            isGold = false;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if customer name is less than 3 characters', async () => {
            name = '12';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer name is more than 255 characters', async () => {
            name = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer phone is less than 5 characters', async () => {
            phone = '1234';
            
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer phone is more than 255 characters', async () => {
            phone = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the customer if it is valid', async () => {
            await exec();

            const customer = await Customer.find({ name: 'customer1', phone: '12345', isGold: false });

            expect(customer).not.toBeNull();
        });

        it('should return the customer if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'customer1');
            expect(res.body).toHaveProperty('phone', '12345');
            expect(res.body).toHaveProperty('isGold', false);
        });
    });

    describe('PUT /:id', () => {
        let token;
        let customer;
        let newName;
        let newPhone;
        let newIsGold;
        let id;

        const exec = async () => {
            return request(server)
                .put(`/api/customers/${id}`)
                .set('x-auth-token', token)
                .send({ name: newName, phone: newPhone, isGold: newIsGold });
        }

        beforeEach(async () => {
            // Before each test we need to create a customer and 
            // put it in the database.
            customer = new Customer({ 
                name: 'customer1', 
                phone: '12345', 
                isGold: false 
            });
            await customer.save();

            token = new User().generateAuthToken();
            id = customer._id;
            newName = 'updatedName';
            newPhone = 'newNumber';
            newIsGold = true;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if customer name is less than 3 characters', async () => {
            newName = '12';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer name is more than 255 characters', async () => {
            newName = new Array(260).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer phone is less than 5 characters', async () => {
            newPhone = '1234';

            const res = await exec();

            expect(res.status).toBe(400)
        });

        it('should return 400 if customer phone is more than 255 characters', async () => {
            newPhone = new Array(260).join('a');

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

            const updatedCustomer = await Customer.findById(customer._id);

            expect(updatedCustomer.name).toBe(newName);
            expect(updatedCustomer.phone).toBe(newPhone);
            expect(updatedCustomer.isGold).toBe(newIsGold);
        });

        it('should return the updated customer if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
            expect(res.body).toHaveProperty('phone', newPhone);
            expect(res.body).toHaveProperty('isGold', newIsGold);
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let customer;
        let id;

        const exec = async () => {
            return await request(server)
                .delete(`/api/customers/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            // Before each test we need to create a genre and 
            // put it in the database. 
            customer = new Customer({ 
                name: 'customer1', 
                phone: '12345', 
                isGold: false 
            });
            await customer.save();

            token = new User({ isAdmin: true }).generateAuthToken();
            id = customer._id;
        });

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 403 if the user is not an admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();;

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no customer with the given id was found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should delete the customer if input is valid', async () => {
            await exec();
            
            const customerInDb = await Customer.findById(id);

            expect(customerInDb).toBeNull();
        });

        it('should return the removed customer', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', customer._id.toHexString());
            expect(res.body).toHaveProperty('name', customer.name);
            expect(res.body).toHaveProperty('phone', customer.phone);
            expect(res.body).toHaveProperty('isGold', customer.isGold);
        });
    });
});

