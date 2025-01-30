const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    businessName: {
        type: String,
    },
    country: {
        type: String,
        default: "India"
    },
    state: {
        type: String,

    },
    city: {
        type: String,

    },
    pinCode: {
        type: String,

    },
    GSTNumber: {
        type: String,
    },
    address: {
        type: String,

    },
    whatsAppNo: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('User', userSchema);