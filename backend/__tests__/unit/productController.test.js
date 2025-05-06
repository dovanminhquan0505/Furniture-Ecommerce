const { getProducts } = require('../../controllers/productController');
const admin = require('firebase-admin');

// Định nghĩa các mock cho firebase-admin
jest.mock('firebase-admin', () => {
    // Mock get() trả về data
    const getMock = jest.fn();
    
    // Mock collection() trả về object có hàm get()
    const collectionMock = jest.fn().mockReturnValue({
        get: getMock,
        doc: jest.fn().mockReturnThis(),
    });
    
    // Mock firestore() trả về object có hàm collection()
    const firestoreMock = jest.fn().mockReturnValue({
        collection: collectionMock
    });
    
    // Trả về object admin có hàm firestore()
    return {
        firestore: firestoreMock
    };
});

describe('Product Controller Unit Tests', () => {
    let req, res;
    
    // Tham chiếu đến hàm get() đã mock để sử dụng trong test
    const getMock = admin.firestore().collection().get;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return products from Firestore', async () => {
        // Cấu hình mock để trả về data cần thiết
        getMock.mockResolvedValueOnce({
            docs: [
                {
                    id: 'test-product',
                    data: () => ({
                        productName: 'Smart Tivi Xiaomi',
                        price: '210',
                    }),
                    exists: true,
                },
            ],
            empty: false,
            size: 1,
        });

        await getProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            {
                id: 'test-product',
                productName: 'Smart Tivi Xiaomi',
                price: '210',
            },
        ]);
    });

    it('should return 500 if Firestore throws an error', async () => {
        // Cấu hình mock để mô phỏng lỗi
        getMock.mockRejectedValueOnce(new Error('Firestore error'));

        await getProducts(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Error fetching products',
            error: 'Firestore error',
        });
    });
});