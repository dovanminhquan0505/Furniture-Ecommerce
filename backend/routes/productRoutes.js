const express = require("express");
const { 
    getProducts, 
    getProductById, 
    addReview, 
    deleteReview, 
    toggleLikeReview, 
    addReplyToReview, 
    toggleLikeReply,
    getSellerInfo
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);

// Get product by ID
router.get("/:id", getProductById);

// Add review to product
router.post("/:id/reviews", addReview);

// Delete review
router.delete("/:id/reviews", deleteReview);

// Toggle like for review
router.put("/:id/reviews/like", toggleLikeReview);

// Add reply to review
router.post("/:id/reviews/reply", addReplyToReview);

// Toggle like for reply
router.put("/:id/reviews/reply/like", toggleLikeReply);

// Get seller info
router.get("/seller/:id", getSellerInfo);

module.exports = router;