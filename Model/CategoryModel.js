const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    categoryDescription: {
        type: String,
        default: "No description available"
    },
    categoryImage: {
        type: String,
        default: "default-image.jpg"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);