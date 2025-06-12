const express = require("express");
const { 
    getProducts, 
    getProductById, 
    addReview, 
    deleteReview, 
    toggleLikeReview, 
    addReplyToReview, 
    toggleLikeReply,
    getSellerInfo,
    editReview,
    editReply,
    deleteReply,
} = require("../controllers/productController");
const { requireSeller } = require('../controllers/authController'); 

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reviews", addReview);
router.delete("/:id/reviews", deleteReview);
router.put("/:id/reviews/like", toggleLikeReview);
router.post("/:id/reviews/reply", addReplyToReview);
router.put("/:id/reviews/reply/like", toggleLikeReply);
router.put('/:id/edit-review', editReview);
router.put('/:id/edit-reply', editReply);
router.delete('/:id/delete-reply', deleteReply);
router.get("/seller/:id", getSellerInfo);

module.exports = router;