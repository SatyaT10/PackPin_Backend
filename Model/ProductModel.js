const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    categoryName: {
        type: String,
        required: true
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    },
    subCategoryName: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        required: true
    },
    packWithPrice: [{
        packOf: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Product', productSchema);