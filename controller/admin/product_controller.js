const Product = require("../../models/admin/product_model");
const asyncWrapper = require("../../middleware/asyncWrapper");
const appError = require('../../utils/appError');
const httpStatusText = require('../../utils/httpStatusText');
const Unit = require('../../models/admin/unit_model');
const Category = require('../../models/admin/category_model');
const User = require('../../models/user_model');
// Get products by categoryId
const getProductsByCategoryId = asyncWrapper(async (req, res, next) => {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId });
    res.json({ status: httpStatusText.SUCCESS, data: { products } });
});
// Search all products
const getSearchProducts = asyncWrapper(async (req, res, next) => {
    const { query } = req.query;
    let filter = {};

    if (query) {
        filter = {
            name: { $regex: query, $options: "i" }
        };
    }

    console.log("🧐 Filter:", filter); // ✅ Check filter before querying DB

    const products = await Product.find(filter);

    if (!products.length) {
        console.log("⚠️ No products found with filter:", filter); // ✅ Log when no products found
        const error = appError.create('No products found', 400, httpStatusText.FAIL);
        return next(error);
    }

    console.log("✅ Products found:", products.length); // ✅ Log the count of products found

    // Return the actual products found in the database
    res.status(200).json({
        status: "success",
        data: {
            products: products
        }
    });
});


// Search products by category
const searchProductsByCategory = asyncWrapper(async (req, res, next) => {
    const { categoryId } = req.params;
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ status: httpStatusText.FAIL, message: "Search query is required" });
    }

    const products = await Product.find({
        category: categoryId,
        name: { $regex: query, $options: "i" }
    });

    res.json({ status: httpStatusText.SUCCESS, data: { products } });
});
const addToWishlist = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;
    const { productId } = req.body;

    // Check if the user is authorized
    const currentUserId = req.currentUser.user_id;

    console.log(currentUserId);
    console.log(userId);
    if (userId !== currentUserId) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }

    // Find the user and update their wishlist
    const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { wishlist: productId } },
        { new: true }
    );

    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { wishlist: user.wishlist }
    });
});
const removeFromWishlist = asyncWrapper(async (req, res, next) => {
    const { userId, productId } = req.params;

    // Check if the user is authorized
    if (userId !== req.currentUser.user_id) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }

    // Find the user and update their wishlist
    const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: productId } },
        { new: true }
    );

    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { wishlist: user.wishlist }
    });
});
const getWishlist = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;

    // Check if the user is authorized
    if (userId !== req.currentUser.user_id) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }

    const user = await User.findById(userId).populate({
        path: 'wishlist',
        select: '-__v' // Exclude the __v field from the product documents
    });
    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { wishlist: user.wishlist }
    });
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
    await product.deleteOne({ _id: productId });
    res.json({
        status: httpStatusText.SUCCESS,
        message: 'Product deleted successfully'
    });
});

module.exports = { addToWishlist, removeFromWishlist, getWishlist,
     getSearchProducts, searchProductsByCategory, getProductsByCategoryId,
      addProduct, getProductById, updateProduct, deleteProduct };
