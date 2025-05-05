const request = require('supertest');
const app = require('../server');

process.env.NODE_ENV = 'test';

describe('API /api/products Integration with Firestore', () => {
  let server;

  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    server = app.listen(0); 
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('should return products from Firestore', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);

    const product = response.body.find(p => p.productName === 'Smart Tivi Xiaomi');
    expect(product).toBeDefined();
    expect(product).toHaveProperty('productName', 'Smart Tivi Xiaomi');
    expect(product).toHaveProperty('price', '210');
  }, 30000);
});