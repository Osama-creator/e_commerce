const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require('../../utils/appError');
const httpStatusText = require('../../utils/httpStatusText');
const Category = require('../../models/admin/category_model');
const addNewCategory = asyncWrapper(async (req, res, next) => {
    const { name } = req.body;
    console.log(req.file.filename);
    const oldCategory = await Category.findOne({ name });
    if (oldCategory) {
        const error = appError.create('category already exists', 400, httpStatusText.FAIL)
        return next(error);
    }
    const newCategory = new Category({
        name,
        image: req.file.filename
    });
   await newCategory.save();
    res.status(201).json({ status: httpStatusText.SUCCESS, data: { category: newCategory } });
})
const getAllCategories = asyncWrapper(async (req, res) => {
    const query = req.query;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    // get all courses) from DB using Course Model
    const categories = await Category.find({}, {"__v": false}).limit(limit).skip(skip);

    res.json({ status: httpStatusText.SUCCESS, data: {categories}});
})
const updateCategory = asyncWrapper(async (req, res, next) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    // Ensure name is provided and is not empty
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        const error = appError.create('Category name is required and must be a valid string', 400, httpStatusText.FAIL);
        return next(error);
    }
    // Prepare update object
    const updateData = { name };
    // Validate image file (if provided)
    if (req.file) {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const fileExt = req.file.mimetype.split('/')[1].toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            const error = appError.create('Invalid image format. Allowed: jpg, jpeg, png, gif, webp', 400, httpStatusText.FAIL);
            return next(error);
        }
        updateData.image = req.file.filename;
    }
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
    );
    if (!updatedCategory) {
        const error = appError.create('Category not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, data: { category: updatedCategory } });
});


const deleteCategory = asyncWrapper(async (req, res, next) => {
    const { categoryId } = req.params;
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        const error = appError.create('category not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, message: 'category deleted successfully' });
})

module.exports = {
    addNewCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
}