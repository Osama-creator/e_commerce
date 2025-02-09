const express = require('express');
const router = express.Router();
const allowedTo = require('../middleware/allowTo');
const orderController = require('../controller/order_controller');
const verifyToken = require('../middleware/verfiyToken');

// Route to create a new order (POST) - Requires verification token
router.route('/')
    .post(verifyToken, orderController.createOrder) 

// Route to update order status (PUT) - Requires verification token and admin access
router.route('/:orderId')
    .put(verifyToken, allowedTo('ADMIN'), orderController.updateOrderStatus) // Update order status action

// Route to get all orders by status (GET) - Requires verification token and admin access
router.route('/:status')
    .get(verifyToken, allowedTo('ADMIN'), orderController.getOrdersByStatus) // Get orders by status action

// Route to get a specific order by ID (GET) - Requires verification token
router.route('/order/:orderId')
    .get(verifyToken, orderController.getOrderById) // Get order by ID action

// Route to cancel an order (PUT) - Requires verification token
router.route('/:orderId/cancel')
    .put(verifyToken, orderController.cancelOrder) // Cancel order action

// Route to get orders by status for a user (GET) - Requires verification token
router.route('/getOrdersByStatusForUser/:status')
    .get(verifyToken, orderController.getOrdersByStatusForUser) // Get orders by status for the user
// assgin delivery
router.route('/:orderId/assignDelivery')
    .put(verifyToken, allowedTo('ADMIN'), orderController.assignDelivery)
module.exports = router;
