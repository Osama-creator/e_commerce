
const express = require('express');

const router = express.Router();
const appError = require('../utils/appError');

const multer = require('multer');
const allowedTo = require('../middleware/allowTo');

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


const usersController = require('../controller/user_controller')
const verifyToken = require('../middleware/verfiyToken');
router.route('/')
    .get(verifyToken, allowedTo('ADMIN'), usersController.getAllUsers)
router.route('/deleviryman')
    .get(verifyToken, allowedTo('ADMIN'), usersController.getAllDeleviry)
router.route('/deleviryman/:userId').
put(verifyToken, allowedTo('ADMIN'), usersController.ChangeUserStatus);
router.route('/register')
    .post(upload.single('avatar'), usersController.register);
router.route('/login')
    .post(usersController.login);
router.put('/user/:userId', verifyToken, usersController.updateUser);
router.delete('/user/:userId', verifyToken, usersController.deleteUser);
module.exports = router;