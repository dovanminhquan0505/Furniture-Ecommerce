const { getProducts } = require('../controllers/productController');

jest.mock('../config/firebase', () => ({
    db: {
      collection: jest.fn(() => ({
        get: jest.fn(() => ({
          docs: [{ id: '1', data: () => ({ name: 'Test Product', price: 100 }) }],
        })),
      })),
    },
  }));
  
  describe('Product Controller', () => {
    test('getProducts returns an array of products', async () => {
      const products = await getProducts();
      expect(Array.isArray(products)).toBe(true);
      expect(products[0]).toHaveProperty('id', '1');
      expect(products[0]).toHaveProperty('name', 'Test Product');
    });
  });