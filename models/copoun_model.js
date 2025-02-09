const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // Unique coupon code
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true }, // Discount type
    discountValue: { type: Number, required: true }, // Discount amount
    minOrderAmount: { type: Number, default: 0 }, // Minimum order amount required to apply
    maxDiscount: { type: Number }, // Maximum discount limit for percentage-based coupons
    expiryDate: { type: Date, required: true }, // Expiration date
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track users who used the coupon
    isEnabled: { type: Boolean, default: true }
});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
