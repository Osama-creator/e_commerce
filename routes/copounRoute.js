const express = require('express');
const router = express.Router();
const allowedTo = require('../middleware/allowTo');
const copounController = require('../controller/copoun_controller');
const verifyToken = require('../middleware/verfiyToken');

router.route('/')
    .get(verifyToken, allowedTo('ADMIN'), copounController.getAllCoupons)
    .post(verifyToken, allowedTo('ADMIN'), copounController.addNewCoupon);

router.route('/:copounId').put(verifyToken, allowedTo('ADMIN'), copounController.changeCouponStatus);
router.route('/apply').post(verifyToken, copounController.applyCoupon);
module.exports = router;