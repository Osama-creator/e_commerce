const asyncWrapper = require('../middleware/asyncWrapper');
const Coupon = require('../models/copoun_model');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/httpStatusText');

const applyCoupon = async (code, totalAmount, userId) => {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
        throw appError.create('Invalid coupon code', 400, httpStatusText.FAIL);
    }

    if (new Date() > coupon.expiryDate) {
        throw appError.create('Coupon expired', 400, httpStatusText.FAIL);
    }

    if (coupon.usedBy.includes(userId)) {
        throw appError.create('You have already used this coupon', 400, httpStatusText.FAIL);
    }

    if (totalAmount < coupon.minOrderAmount) {
        throw appError.create(`Minimum order amount to use this coupon is ${coupon.minOrderAmount}`, 400, httpStatusText.FAIL);
    }
    if (!coupon.isEnabled) {
        throw appError.create('Coupon is disabled', 400, httpStatusText.FAIL);
    }

    let discount = coupon.discountType === 'percentage'
        ? Math.min(totalAmount * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
        : coupon.discountValue;

    // Mark the coupon as used
    coupon.usedBy.push(userId);
    await coupon.save();

    return discount;
};

const addNewCoupon = asyncWrapper(async (req, res, next) => {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate } = req.body;
    const oldCoupon = await Coupon.findOne({ code });
    if (oldCoupon) {
        const error = appError.create('coupon already exists', 400, httpStatusText.FAIL)
        return next(error);
    }
    const newCoupon = new Coupon({
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        expiryDate
    });
   await newCoupon.save();
    res.status(201).json({ status: httpStatusText.SUCCESS, data: { coupon: newCoupon } });
})
const getAllCoupons = asyncWrapper(async (req, res) => {
    const query = req.query;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const coupons = await Coupon.find({}, {"__v": false}).limit(limit).skip(skip);
    res.json({ status: httpStatusText.SUCCESS, data: {coupons}});
})
const changeCouponStatus = asyncWrapper(async (req, res, next) => {
    const { copounId } = req.params;
    console.log(req.params);
    console.log(copounId);
    const { isEnabled } = req.body;
    const coupon = await Coupon.findById(copounId);
    if (!coupon) {
        const error = appError.create('Coupon not found', 400, httpStatusText.FAIL)
        return next(error);
    }
    coupon.isEnabled = isEnabled;
    await coupon.save();
    res.status(200).json({ status: httpStatusText.SUCCESS, data: { coupon } });
})
module.exports = { applyCoupon, addNewCoupon, getAllCoupons , changeCouponStatus };
