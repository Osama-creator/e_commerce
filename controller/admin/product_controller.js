const Product = require("../../models/admin/product_model");
const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require('../../utils/appError');
const httpStatusText = require('../../utils/httpStatusText');
const Unit = require('../../models/admin/unit_model');
const Category = require('../../models/admin/category_model');

// Get products by categoryId
const getProductsByCategoryId = asyncWrapper(async (req, res , next) => {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId });
    res.json({ status: httpStatusText.SUCCESS, data: { products } });
});

// Add product
const addProduct = asyncWrapper(async (req, res, next) => {
    const { name, description, price, categoryId, stock, unitId } = req.body;

    // Ensure the unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
        const error = appError.create('Unit not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Ensure the category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
        const error = appError.create('Category not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Ensure product is not already in the database
    const oldProduct = await Product.findOne({ name });
    if (oldProduct) {
        const error = appError.create('Product already exists', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Create new product
    const newProduct = new Product({
        name,
        description,
        price,
        category: categoryId,  // Assign category ID
        stock,
        image: req.file.filename,
        unit: unitId
    });

    // Save new product
    await newProduct.save();
    res.status(201).json({ status: httpStatusText.SUCCESS, data: { product: newProduct } });
});
const getProductById = asyncWrapper(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
        const error = appError.create('Product not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    res.json({ status: httpStatusText.SUCCESS, data: { product } });
})
// Update product
const updateProduct = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;
    const { name, description, price, categoryId, stock, unitId } = req.body;

    // Ensure the product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = appError.create('Product not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    
    // Update the product with the provided values
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.categoryId = categoryId || product.categoryId;
    product.stock = stock || product.stock;
    product.unitId = unitId || product.unitId;

    // Validate image file (if provided)
    if (req.file) {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            const error = appError.create('Invalid image file format', 400, httpStatusText.FAIL);
            return next(error);
        }
        product.image = req.file.filename;
    }


    // Save updated product
    await product.save();
    res.json({ status: httpStatusText.SUCCESS, data: { product } });
});

// Delete product
const deleteProduct = asyncWrapper(async (req, res, next) => {
    const { productId } = req.params;

    // Ensure the product exists
    const product = await Product.findById(productId);
    if (!product) {
        const error = appError.create('Product not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    // Delete the product
    await product.deleteOne( { _id: productId } );
    res.json({
        status: httpStatusText.SUCCESS,
        message: 'Product deleted successfully'
    });
});

module.exports = { getProductsByCategoryId,addProduct,getProductById, updateProduct, deleteProduct };
