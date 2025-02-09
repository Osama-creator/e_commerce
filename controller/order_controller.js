const asyncWrapper = require('../middleware/asyncWrapper');
const Order = require('../models/order_model');
const Product = require('../models/admin/product_model');
const User = require('../models/user_model');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');
const copounController = require('../controller/copoun_controller');
const createOrder = asyncWrapper(async (req, res, next) => {
    const { products, couponCode } = req.body;
    const userId = req.currentUser.user_id;
    
    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0 || !products.every(item => item.quantity > 0)) {
        return next(appError.create('Invalid input data', 400, httpStatusText.FAIL));
    }

    // Get user details
    const user = await User.findById(userId).select("firstName lastName phone avatar address");
    if (!user) {
        return next(appError.create('User not found', 404, httpStatusText.FAIL));
    }

    // Calculate total price and decrease product stock
    let totalPrice = 0;
    for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(appError.create(`Product not found: ${item.product}`, 404, httpStatusText.FAIL));
        }
        if (product.stock < item.quantity) {
            return next(appError.create(`Insufficient stock for product: ${product.name}`, 400, httpStatusText.FAIL));
        }
        totalPrice += product.price * item.quantity;
        product.stock -= item.quantity;
        await product.save();
    }

    // Apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
        try {
            discount = await copounController.applyCoupon(couponCode, totalPrice, userId);
            appliedCoupon = couponCode;
        } catch (error) {
            console.warn(`⚠️ Coupon error: ${error.message}`); // Log the coupon error but continue
        }
    }
    // Create the order
    const order = new Order({
        user: userId,
        userDetails: {
            name: `${user.firstName} ${user.lastName}`,
            phone: user.phone,
            avatar: user.avatar,
            address: user.address
        },
        products,
        totalPrice: totalPrice - discount,
        couponUsed: couponCode || null,
        status: 'pending'
    });

    await order.save();

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: { order }
    });
});

const assignDelivery = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { deliveryId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
        const error = appError.create('Order not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    const  user=  User.findById(deliveryId);
    if (!user) {
        const error = appError.create('Delivery not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    order.deleviryMan = deliveryId;
    await order.save();
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { order }
    });
})
const getOrderById = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const role = req.currentUser.role ;
    const order = await Order.findById(orderId);
    console.log(role);
    console.log(req.currentUser.user_id);
    console.log(order.user);
    if (!order) {
        const error = appError.create('Order not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    if (role === 'USER' && order.user.toString() !== req.currentUser.user_id.toString()) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { order }
    });
})

const getOrdersByStatusForUser = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.user_id;
    console.log(userId);
    const { status } = req.params;
    const orders = await Order.find({ user: userId, status });
    if (!orders) {
        const error = appError.create('Orders not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { orders }
    });
})
const getOrdersByStatus = asyncWrapper(async (req, res, next) => {
    const { status } = req.params;
    const orders = await Order.find({ status });
    if (!orders) {
        const error = appError.create('Orders not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { orders }
    });
})
const updateOrderStatus = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'preparing', 'in-delivery', 'delivered', 'canceled'];
    if (!validStatuses.includes(status)) {
        const error = appError.create('Invalid status', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Find and update the order
    const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
    );

    if (!order) {
        const error = appError.create('Order not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { order }
    });
});
const cancelOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.currentUser.user_id;

    // Find the order
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        const error = appError.create('Order not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    // Check if the order is still pending
    if (order.status !== 'pending') {
        const error = appError.create('Order cannot be canceled', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Increase product stock
    for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }

    // Update order status to canceled
    order.status = 'canceled';
    await order.save();

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { order }
    });
});
module.exports = {
    createOrder,
    updateOrderStatus,
    assignDelivery,
    cancelOrder,
    getOrderById,
    getOrdersByStatusForUser,
    getOrdersByStatus
};