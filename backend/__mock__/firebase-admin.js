const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    get: jest.fn(() => ({
        docs: [
            {
                id: 'test-product',
                data: jest.fn(() => ({
                    productName: 'Smart Tivi Xiaomi',
                    price: '210',
                })),
                exists: true,
            },
        ],
        empty: false,
        size: 1,
    })),
};

const admin = {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    credential: {
        cert: jest.fn(),
    },
};

module.exports = admin;