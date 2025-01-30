const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    is_admin: {
        type: Number,
        default: 1
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Admin', UserSchema);