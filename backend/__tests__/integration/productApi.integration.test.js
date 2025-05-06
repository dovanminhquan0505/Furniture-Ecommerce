const request = require('supertest');
const admin = require('firebase-admin');
const app = require('../../server');

describe('Product API Integration Tests', () => {
  let server;
  let testProductIds = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:9090';

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: 'furniture-ecommerce-435809',
        });
      }
  
      const db = admin.firestore();
      const productsRef = db.collection('products');
      const batch = db.batch(); 
  
      const testProducts = [
        {
          productName: 'Smart Tivi Xiaomi',
          price: '210',
          category: 'television',
          shortDesc: 'Smart Tivi Xiaomi',
          description: 'Smart Tivi Xiaomi',
          imgUrl: 'https://firebasestorage.googleapis.com/...',
          reviews: [],
          sellerId: 'DVV3QS4IYsAZk7aOXOQE',
        },
        {
          productName: 'Arm chair',
          price: '153',
          category: 'chair',
          shortDesc: 'Arm chair',
          description: 'Arm chair',
          imgUrl: 'https://firebasestorage.googleapis.com/...',
          reviews: [],
          sellerId: 'DVV3QS4IYsAZk7aOXOQE',
        },
      ];
  
      // Add all products to batch
      testProductIds = [];
      for (const product of testProducts) {
        const docRef = productsRef.doc(); 
        batch.set(docRef, product); 
        testProductIds.push(docRef.id); 
      }
  
      await batch.commit(); 
      console.log('Test products added with IDs:', testProductIds);
  
      server = app.listen(0);
    } catch (error) {
      console.error('Firebase initialization or data seeding failed:', error.message);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    try {
      // Clean up test data
      if (testProductIds.length > 0) {
        const db = admin.firestore();
        const batch = db.batch();
        
        for (const id of testProductIds) {
          const docRef = db.collection('products').doc(id);
          batch.delete(docRef);
        }
        
        await batch.commit();
        console.log('Test products cleaned up successfully');
      }
      
      // Close the server first
      await new Promise((resolve) => {
        if (server) {
          server.close(() => {
            console.log('Server closed successfully');
            resolve();
          });
        } else {
          resolve();
        }
      });
      
      await admin.firestore().terminate();
      
      await Promise.all(
        admin.apps.map(app => app.delete())
      );
      
      console.log('All Firebase resources cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }, 30000);

  it('GET /api/products should return all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Accept', 'application/json');
      
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    
    // Check if our test products are included in the response
    const productNames = res.body.map(item => item.productName);
    expect(productNames).toContain('Smart Tivi Xiaomi');
    expect(productNames).toContain('Arm chair');
  }, 10000);

  it('GET /api/products/:id should return a specific product', async () => {
    // Assuming we have at least one product ID from our test products
    if (testProductIds.length > 0) {
      const res = await request(app)
        .get(`/api/products/${testProductIds[0]}`)
        .set('Accept', 'application/json');
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', testProductIds[0]);
      expect(res.body).toHaveProperty('productName');
      expect(res.body).toHaveProperty('price');
    } else {
      console.warn('No test product IDs available to test GET /api/products/:id');
    }
  }, 10000);
});