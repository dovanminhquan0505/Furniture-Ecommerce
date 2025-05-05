const request = require('supertest');
const app = require('../../server'); 

describe('Product API Integration', () => {
    let server;

    beforeAll(() => {
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
        server = app.listen(0);
    });

    afterAll(async () => {
        await new Promise(resolve => server.close(resolve));
    });

    it('GET /api/products should return 200 and products array', async () => {
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});