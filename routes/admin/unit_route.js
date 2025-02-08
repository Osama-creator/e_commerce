
const express = require('express');

const router = express.Router();


const appError = require('../../utils/appError');
const allowedTo = require('../../middleware/allowTo');
const unitController = require('../../controller/admin/unit_controller');
const verifyToken = require('../../middleware/verfiyToken');
router.route('/')
    .get(verifyToken, allowedTo('ADMIN'), unitController.getAllUnits)
    .post(verifyToken, allowedTo('ADMIN'),unitController.addNewUnit);
router.route('/:unitId')    
    .put(verifyToken, allowedTo('ADMIN'), unitController.updateUnit)
    .delete(verifyToken, allowedTo('ADMIN'), unitController.deleteUnit);
module.exports = router;