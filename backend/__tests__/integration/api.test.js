const request = require('supertest');
const app = require('../../app');

describe('Product API Integration', () => {
  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });

  it('GET /api/products should return 200 and products array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});