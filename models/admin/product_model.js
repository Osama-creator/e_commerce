const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String },
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ["available", "out of stock"], default: "available" },
    // Quantity with dynamic unit selection
    unit: { type: String, required: true },
    specifications: { type: Map, of: String },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
