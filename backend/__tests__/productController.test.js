const { getProducts } = require("../controllers/productController");
const admin = require("firebase-admin");

// Mock Firebase Admin
jest.mock("firebase-admin", () => {
    const mockFirestore = {
        collection: jest.fn(() => ({
            get: jest.fn(() => ({
                docs: [
                    {
                        id: "1",
                        data: () => ({ name: "Test Product", price: 100 }),
                    },
                ],
            })),
        })),
    };
    return {
        initializeApp: jest.fn(),
        credential: { cert: jest.fn() },
        firestore: jest.fn(() => mockFirestore),
    };
});

describe("Product Controller", () => {
    beforeAll(() => {
        admin.initializeApp();
    });

    test("getProducts returns an array of products", async () => {
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        await getProducts(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));
        const products = res.json.mock.calls[0][0];
        expect(Array.isArray(products)).toBe(true);
        expect(products[0]).toHaveProperty("id", "1");
        expect(products[0]).toHaveProperty("name", "Test Product");
    });
});