const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    categoryName: {
        type: String,
        required: true
    },
    subCategoryName: {
        type: String,
        required: true
    },
    subCategoryDescription: {
        type: String,
        default: "No description available"
    },
    subCategoryImage: {
        type: String,
        default: "default-image.jpg"
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('SubCategory', categorySchema);