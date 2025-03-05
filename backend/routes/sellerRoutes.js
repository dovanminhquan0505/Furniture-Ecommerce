const express = require('express');
const { getSellerInfo, updateSellerInfo, getCurrentSeller, getAllSellers, getSellerById } = require('../controllers/sellerController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { requireSeller } = require('../controllers/authController'); 
const router = express.Router();

// router.use(requireSeller);  

router.get('/', getAllSellers);
router.get('/me', getCurrentSeller);
router.get('/:sellerId', getSellerById);
router.get('/:sellerId/store', getSellerInfo);
router.put('/:sellerId/store', updateSellerInfo);
router.get('/:sellerId/dashboard', getDashboardStats);

module.exports = router;