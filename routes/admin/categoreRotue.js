
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
const categoryController = require('../../controller/admin/category_controller');
const verifyToken = require('../../middleware/verfiyToken');
router.route('/')
    .get(verifyToken, allowedTo('ADMIN'), categoryController.getAllCategories)
    .post(verifyToken, allowedTo('ADMIN'), upload.single('image'), categoryController.addNewCategory);
router.route('/:categoryId')    
    .put(verifyToken, allowedTo('ADMIN'), upload.single('image'), categoryController.updateCategory)
    .delete(verifyToken, allowedTo('ADMIN'), categoryController.deleteCategory);
module.exports = router;