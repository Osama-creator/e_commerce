const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require('../../utils/appError');
const httpStatusText = require('../../utils/httpStatusText');
const Unit = require('../../models/admin/unit_model');
const addNewUnit = asyncWrapper(async (req, res, next) => {
    const { name } = req.body;
    const oldUnit = await Unit.findOne({ name });
    if (oldUnit) {
        const error = appError.create('unit already exists', 400, httpStatusText.FAIL)
        return next(error);
    }
    const newUnit = new Unit({
        name
    });
   await newUnit.save();
    res.status(201).json({ status: httpStatusText.SUCCESS, data: { unit: newUnit } });
})
const getAllUnits = asyncWrapper(async (req, res) => {
    const query = req.query;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const units = await Unit.find({}, {"__v": false}).limit(limit).skip(skip);
    res.json({ status: httpStatusText.SUCCESS, data: {units}});
})
const updateUnit = asyncWrapper(async (req, res, next) => {
    const { unitId } = req.params;
    const { name } = req.body;

    // Ensure name is provided and is not empty
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        const error = appError.create('Unit name is required and must be a valid string', 400, httpStatusText.FAIL);
        return next(error);
    }
    // Prepare update object
    const updateData = { name };
    
    // Update unit
    const updatedUnit = await Unit.findByIdAndUpdate(
        unitId,
        updateData,
        { new: true, runValidators: true }
    );
    if (!updatedUnit) {
        const error = appError.create('Unit not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, data: { unit: updatedUnit } });
});


const deleteUnit = asyncWrapper(async (req, res, next) => {
    const { unitId } = req.params;
    const unit = await Unit.findByIdAndDelete(unitId);
    if (!unit) {
        const error = appError.create('unit not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, message: 'unit deleted successfully' });
})

module.exports = {
    addNewUnit,
    getAllUnits,
    updateUnit,
    deleteUnit
}