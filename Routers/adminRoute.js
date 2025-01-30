const adminRoute = require("express").Router()
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const auth = require('../Middleware/auth');
const {
    newCategory,
    userLogin,
    NewUser,
    getAllCategory,
    updateCategory,
    getCatDaitles,
    deleteCategory,
    getAllSubCategory,
    addNewSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoryDaitles,
    getCatAndSubCatWiseProduct,
    createProduct,
    getAllProduct,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    getCategoryWiseSubCategory
} = require("../Controllers/adminControllers");
const { getAllOrder, getAllOrderInExcel } = require("../Controllers/orderControllers");



const Storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../Images")
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        if (!file) return
        const name = `${Date.now()}-byAdmin-${file.originalname}`;
        cb(null, name);
    }
});



const Upload = multer({ storage: Storage });


adminRoute.post('/register', NewUser)

adminRoute.post('/login', userLogin)


adminRoute.post('/add-category', auth.verifyToken, Upload.single('categoryImage'), newCategory);

adminRoute.get('/get-all-category', auth.verifyToken, getAllCategory)

adminRoute.post('/update-category', auth.verifyToken, updateCategory)

adminRoute.post('/category-daitles', auth.verifyToken, getCatDaitles)

adminRoute.post('/delete-category', auth.verifyToken, deleteCategory)

adminRoute.post('/create-subcategory', auth.verifyToken, Upload.single('subcategoryImage'), addNewSubCategory);

adminRoute.get('/get-subcategory', auth.verifyToken, getAllSubCategory);

adminRoute.post('/update-subcategory', auth.verifyToken, updateSubCategory);

adminRoute.post('/detele-subcategory', auth.verifyToken, deleteSubCategory);

adminRoute.post('/subcategory-daitles', auth.verifyToken, getSubCategoryDaitles)

adminRoute.post('/subcategory-with-category', auth.verifyToken, getCategoryWiseSubCategory)

adminRoute.post('/create-product', auth.verifyToken, Upload.single('productImage'), createProduct)

adminRoute.get('/all-product', auth.verifyToken, getAllProduct)

adminRoute.post('/get-product', auth.verifyToken, getSingleProduct);

adminRoute.post('/update-product', auth.verifyToken, updateProduct);

adminRoute.post('/delete-product', auth.verifyToken, deleteProduct);

adminRoute.post('/product-with-cat-subcat', auth.verifyToken, getCatAndSubCatWiseProduct);

adminRoute.get('/all-order', auth.verifyToken, getAllOrder);

adminRoute.get('/order-excle', auth.verifyToken, getAllOrderInExcel)

module.exports = adminRoute