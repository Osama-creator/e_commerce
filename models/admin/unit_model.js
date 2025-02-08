const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true } // Example: "kg", "piece", "liter"
});

module.exports = mongoose.model("Unit", unitSchema);
