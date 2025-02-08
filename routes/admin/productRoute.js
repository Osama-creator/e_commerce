
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
    .get(verifyToken, allowedTo('ADMIN'), productController.getProductsByCategoryId);
router.route('/:productId')    
    .get(verifyToken, allowedTo('ADMIN'), productController.getProductById)
    .put(verifyToken, allowedTo('ADMIN'), upload.single('image'), productController.updateProduct)
    .delete(verifyToken, allowedTo('ADMIN'), productController.deleteProduct);
module.exports = router;