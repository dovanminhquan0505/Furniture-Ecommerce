const admin = require("firebase-admin");
const db = admin.firestore();

const getProducts = async (req, res) => {
    try {
        const snapshot = await db.collection("products").get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const productDoc = await db.collection("products").doc(productId).get();
        
        if (!productDoc.exists) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        const product = { id: productDoc.id, ...productDoc.data() };
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
    }
};

const addReview = async (req, res) => {
    try {
        const productId = req.params.id;
        const { userName, message, rating } = req.body;
        
        const productRef = db.collection("products").doc(productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        const reviewObject = {
            userName,
            message,
            rating,
            createdAt: new Date().toISOString(),
            likes: []
        };
        
        // Khởi tạo reviews nếu chưa tồn tại
        const productData = productDoc.data();
        const reviews = productData.reviews || [];

        await productRef.update({
            reviews: [...reviews, reviewObject]
        });
        
        res.status(200).json({ message: "Review added successfully" });
    } catch (error) {
        console.error("Server error adding review:", error);
        res.status(500).json({ message: "Error adding review", error: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const productId = req.params.id;
        const reviewToDelete = req.body.review;
        
        await db.collection("products").doc(productId).update({
            reviews: admin.firestore.FieldValue.arrayRemove(reviewToDelete)
        });
        
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error });
    }
};

const toggleLikeReview = async (req, res) => {
    try {
        const productId = req.params.id;
        const { reviewIndex, userId } = req.body;
        
        const productDoc = await db.collection("products").doc(productId).get();
        const product = productDoc.data();
        
        if (!product.reviews || !product.reviews[reviewIndex]) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        const updatedReviews = [...product.reviews];
        const likes = updatedReviews[reviewIndex].likes || [];
        
        const userLikeIndex = likes.indexOf(userId);
        if (userLikeIndex > -1) {
            likes.splice(userLikeIndex, 1);
        } else {
            likes.push(userId);
        }
        
        updatedReviews[reviewIndex].likes = likes;
        
        await db.collection("products").doc(productId).update({
            reviews: updatedReviews
        });
        
        res.status(200).json({ 
            message: userLikeIndex > -1 ? "Review unliked" : "Review liked", 
            likes 
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling like", error });
    }
};

const addReplyToReview = async (req, res) => {
    try {
        const productId = req.params.id;
        const { reviewIndex, userName, message } = req.body;
        
        const productRef = db.collection("products").doc(productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ message: "Product not found" });
        }

        const product = productDoc.data();
        
        if (!product.reviews || !product.reviews[reviewIndex]) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        const updatedReviews = [...product.reviews];
        if (!updatedReviews[reviewIndex].replies) {
            updatedReviews[reviewIndex].replies = [];
        }
        
        updatedReviews[reviewIndex].replies.push({
            userName,
            message,
            createdAt: new Date().toISOString(),
            likes: []
        });
        
        await productRef.update({
            reviews: updatedReviews
        });
        
        res.status(200).json({ message: "Reply added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error adding reply", error });
    }
};

const toggleLikeReply = async (req, res) => {
    try {
        const productId = req.params.id;
        const { reviewIndex, replyIndex, userId } = req.body;
        
        const productDoc = await db.collection("products").doc(productId).get();
        const product = productDoc.data();
        
        if (!product.reviews || !product.reviews[reviewIndex] || 
            !product.reviews[reviewIndex].replies || !product.reviews[reviewIndex].replies[replyIndex]) {
            return res.status(404).json({ message: "Reply not found" });
        }
        
        const updatedReviews = [...product.reviews];
        const targetReply = updatedReviews[reviewIndex].replies[replyIndex];
        
        if (!targetReply.likes) {
            targetReply.likes = [];
        }
        
        const userLikeIndex = targetReply.likes.indexOf(userId);
        if (userLikeIndex > -1) {
            targetReply.likes.splice(userLikeIndex, 1);
        } else {
            targetReply.likes.push(userId);
        }
        
        await db.collection("products").doc(productId).update({
            reviews: updatedReviews
        });
        
        res.status(200).json({ 
            message: userLikeIndex > -1 ? "Reply unliked" : "Reply liked",
            likes: targetReply.likes
        });
    } catch (error) {
        res.status(500).json({ message: "Error toggling like for reply", error });
    }
};

// API xử lý thông tin cửa hàng
const getSellerInfo = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const sellerDoc = await db.collection("sellers").doc(sellerId).get();
        
        if (!sellerDoc.exists) {
            return res.status(404).json({ message: "Seller not found" });
        }
        
        const seller = { id: sellerDoc.id, ...sellerDoc.data() };
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ message: "Error fetching seller info", error });
    }
};

module.exports = { 
    getProducts,
    getProductById,
    addReview,
    deleteReview,
    toggleLikeReview,
    addReplyToReview,
    toggleLikeReply,
    getSellerInfo
};