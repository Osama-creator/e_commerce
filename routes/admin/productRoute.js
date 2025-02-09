
const express = require('express');

const router = express.Router();

const multer = require('multer');

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const fileName = `user-${Date.now()}.${ext}`;
        cb(null, fileName);
    }
})

const fileFilter = (req, file, cb) => {
    const imageType = file.mimetype.split('/')[0];

    if (imageType === 'image') {
        return cb(null, true)
    } else {
        return cb(appError.create('file must be an image', 400), false)
    }
}

const upload = multer({
    storage: diskStorage,
    fileFilter
})
const appError = require('../../utils/appError');
const allowedTo = require('../../middleware/allowTo');
const productController = require('../../controller/admin/product_controller');
const verifyToken = require('../../middleware/verfiyToken');
router.route('/')
    .post(verifyToken, allowedTo('ADMIN'), upload.single('image'), productController.addProduct);
router.route('/:categoryId')    
    .get(verifyToken, productController.getProductsByCategoryId);
router.route('/:productId')    
    .get(verifyToken,  productController.getProductById)
    .put(verifyToken, allowedTo('ADMIN'), upload.single('image'), productController.updateProduct)
    .delete(verifyToken, allowedTo('ADMIN'), productController.deleteProduct);
router.route('/search/searchAllProducts')
    .get(productController.getSearchProducts);
router.route('/search/:categoryId')
    .get(verifyToken, productController.searchProductsByCategory);
// Wishlist routes
router.route('/:userId/wishlist')
    .get(verifyToken, productController.getWishlist) // Get user's wishlist
    .post(verifyToken, productController.addToWishlist); // Add product to wishlist

router.route('/:userId/wishlist/:productId')
    .delete(verifyToken, productController.removeFromWishlist); // Remove product from wishlist
module.exports = router;