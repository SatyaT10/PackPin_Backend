const userRoute = require("express").Router()
const auth = require('../Middleware/auth')
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
    getAllCategory,
    getCategoryWiseSubCategory,
    getCategoryWiseProduct,
    getCatAndSubCatWiseProduct,
    getAllProduct,
    getSingleProduct
} = require("../Controllers/adminControllers");
const {
    userRegister,
    userLogin,
    changePassword,
    forgetPassword,
    resetPassword
} = require("../Controllers/userControllers");
const { placeOrder, getUserOrder, getUserOrderDaitle } = require("../Controllers/orderControllers");

userRoute.post('/register', userRegister);

userRoute.post('/login', userLogin);

userRoute.post('/change-password', auth.verifyToken, changePassword)

userRoute.post('/forgot-password', forgetPassword)

userRoute.post('/reset-password', resetPassword)

userRoute.get('/category', getAllCategory)

userRoute.post('/get-subcategory', getCategoryWiseSubCategory);

userRoute.post('/get-product', getCategoryWiseProduct)

userRoute.post('/get-cat-subcat-product', getCatAndSubCatWiseProduct);

userRoute.get('/get-all-product', getAllProduct);

userRoute.post('/get-product-daitels', getSingleProduct);

userRoute.post('/place-order', auth.verifyToken, placeOrder);

userRoute.post('/get-user-order', auth.verifyToken, getUserOrder);

userRoute.post('/get-order-daitles', auth.verifyToken, getUserOrderDaitle);

module.exports = userRoute;