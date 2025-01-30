require('dotenv').config();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const Product = require('../Model/ProductModel');
const Admin = require('../Model/adminModel');
const Category = require('../Model/CategoryModel');
const SubCategory = require('../Model/SubCategoryModel');
const CustomError = require('../error/CustomError');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const NewUser = async (req, res, next) => {
    try {
        const reqBody = req.body;
        const { name, email, password, mobile } = reqBody;
        if (!email || !password || !name || !mobile) {
            throw new CustomError('Please fill all the fields', 400);
        }
        const userData = await Admin.findOne({ email: email });
        const newPassword = await securePassword(password);
        if (userData) {
            throw new CustomError('Email already exists', 400);
        } else {
            await Admin.create({
                name: name,
                email: email,
                password: newPassword,
                mobile: mobile,
            });
            res.status(201).json({ success: true, msg: "Registation Completed Successfully!" });
        }
    } catch (error) {
        console.error("Error when admin wants to register himself:", error.message);
        next(error)
    }
}

const userLogin = async (req, res) => {
    try {
        const reqBody = req.body;
        const { email, password } = reqBody;
        if (!email || !password) {
            throw new CustomError('Please fill all the fields', 400);
        }
        const userData = await Admin.findOne({ email: email }).select('+password');
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                const user = {
                    id: userData._id,
                    email: userData.email,
                    name: userData.name,
                    isAdmin: userData.is_admin
                }
                const token = await jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIREIN });
                const response = {
                    success: true,
                    message: "User LogedIn",
                    token: token,
                    userData: user
                }
                res.status(201).json(response);
            } else {
                res.status(400).json({ success: false, msg: "Email Or Password Wrong!" });
            }
        } else {
            res.status(400).json({ success: false, msg: "Email Or Password Wrong!" });
        }

    } catch (error) {
        res.status(400).json({ success: false, msg: error.message });
    }
}

const newCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const { categoryName, categoryDescription } = req.body;
        const filename = req.file.filename
        let cateImage = `${process.env.BASE_IMG_URL}/Images/${filename}`;
        if (isAdmin == 1) {
            if (categoryName) {
                await Category.create({
                    categoryName,
                    categoryDescription,
                    categoryImage: cateImage
                });
                res.status(201).json({
                    success: true,
                    message: "Category added successfully...."
                })
            } else {
                throw new CustomError("Category name is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.log("Error creating product category:", error.message);
        next(error)
    }
}

const getAllCategory = async (req, res, next) => {
    try {
        const categories = await Category.find();
        if (categories) {
            res.status(200).json({
                success: true,
                categories
            })
        } else {
            throw new CustomError("No categories found", 404);
        }
    } catch (error) {
        console.error("Error retrieving product category:", error.message);
        next(error)
    }
}

const deleteCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const categoryId = req.body.categoryId;
        if (isAdmin == 1) {
            if (categoryId) {
                const category = await Category.findOne({
                    _id: categoryId
                });
                if (category) {
                    await Product.deleteMany({
                        categoryId: categoryId
                    });
                    await SubCategory.deleteMany({
                        categoryId: categoryId
                    });
                    await Category.findOneAndDelete({
                        _id: categoryId
                    })
                    res.status(200).json({
                        success: true,
                        message: "Category deleted successfully"
                    })
                } else {
                    throw new CustomError("Category not found", 404);
                }
            } else {
                throw new CustomError("Category id is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error deleting product category:", error.message);
        next(error)
    }
}

const updateCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const categoryId = req.body.categoryId;
        let catImg;
        if (isAdmin == 1) {
            if (categoryId) {
                const categoryData = await Category.findOne({
                    _id: categoryId
                });
                if (categoryData) {
                    if (req.file) {
                        const filename = req.file.filename
                        catImg = `${process.env.BASE_IMG_URL}/Images/${filename}`;
                    } else {
                        catImg = categoryData.categoryImage;
                    }
                    categoryData.categoryName = req.body.categoryName
                    categoryData.categoryDescription = req.body.categoryDescription
                    categoryData.categoryImage = catImg
                    await categoryData.save();
                    res.status(200).json({
                        success: true,
                        message: "Category updated succesfully!"
                    })
                } else {
                    throw new CustomError("Category not found", 404);
                }
            } else {
                throw new CustomError("Category id and data are required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error update product category:", error.message);
        next(error)
    }
}

const getCatDaitles = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const categoryId = req.body.categoryId
        if (isAdmin == 1) {
            if (categoryId) {
                const category = await Category.findOne({
                    _id: categoryId
                });
                if (category) {
                    res.status(200).json({
                        success: true,
                        message: "Retriving category data",
                        data: category
                    });
                } else {
                    throw new CustomError("Category not found", 404);
                }
            } else {
                throw new CustomError("Category id is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }

    } catch (error) {
        console.error("Error retrieving product category dailtes:", error.message);
        next(error)
    }
}

const addNewSubCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const { categoryId, name, description, } = req.body
        const filename = req.file.filename
        const subCategoryImg = `${process.env.BASE_IMG_URL}/Images/${filename}`;
        if (isAdmin == 1) {
            if (!categoryId || !name || !description) {
                throw new CustomError("Category id, name and description are required", 400);
            }
            const categoryData = await Category.findOne({
                _id: categoryId
            });
            if (categoryData) {
                const data = await SubCategory.create({
                    subCategoryName: name,
                    subCategoryDescription: description,
                    categoryId: categoryId,
                    categoryName: categoryData.categoryName,
                    subCategoryImage: subCategoryImg
                });
                res.status(
                    201
                ).send({
                    success: true,
                    data: data,
                    message: "Sub Category created succesfully"
                })
            } else {
                throw new CustomError("Category not found", 404);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error retrieving product category dailtes:", error.message);
        next(error)
    }
}

const getAllSubCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        if (isAdmin) {
            const subCategoryData = await SubCategory.find();
            if (subCategoryData) {
                res.status(200).send({
                    success: true,
                    data: subCategoryData,
                    message: "Retriving all subCategory......",
                    count:subCategoryData.length
                })
            } else {
                throw new CustomError("Sub Category not found", 404);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error retrieving product category dailtes:", error.message);
        next(error)
    }
}

const deleteSubCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const subCategoryId = req.body.subCategoryId
        if (isAdmin) {
            if (subCategoryId) {
                const subCategoryData = await SubCategory.findOne({
                    _id: subCategoryId
                })
                if (subCategoryData) {
                    await Product.deleteMany({
                        subCategoryId: subCategoryId
                    })
                    await SubCategory.findOneAndDelete({
                        _id: subCategoryId
                    })
                    res.status(200).send({
                        success: true,
                        message: "Sub Category deleted successfully",
                        data: subCategoryData
                    })
                } else {
                    throw new CustomError("Sub Category not found", 404);
                }
            } else {
                throw new CustomError("Sub Category id is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error deleting product category dailtes:", error.message);
        next(error)
    }
}

const updateSubCategory = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const subCategoryId = req.body.subCategoryId;
        const { name, description } = req.body
        let subCategoryImg;
        if (isAdmin) {
            if (subCategoryId) {
                const subCategoryData = await SubCategory.findOne({
                    _id: subCategoryId
                })
                if (subCategoryData) {
                    if (req.file) {
                        const filename = req.file.filename
                        subCategoryImg = `${process.env.BASE_IMG_URL}/Images/${filename}`
                    } else {
                        subCategoryImg = subCategoryData.subCategoryImage
                    }
                    const updatedSubCategory = await SubCategory.findOneAndUpdate({
                        _id: subCategoryId
                    }, {
                        $set: {
                            subCategoryName: name,
                            subCategoryDescription: description,
                            subCategoryImage: subCategoryImg
                        }
                    })
                    res.status(201).send({
                        success: true,
                        data: updatedSubCategory,
                        message: "Sub Category updated successfully"
                    })
                } else {
                    throw new CustomError("Sub Category not found", 404);
                }
            } else {
                throw new CustomError("Sub Category id is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error updating product category dailtes:", error.message);
        next(error)
    }
}

const getSubCategoryDaitles = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const subCategoryId = req.body.subCategoryId;
        console.log(subCategoryId);
        
        if (isAdmin) {
            if (subCategoryId) {
                const subCategoryData = await SubCategory.findOne({
                    _id: subCategoryId
                })
                if (subCategoryData) {
                    res.status(200).send({
                        success: true,
                        data: subCategoryData,
                        message: "Retriving sub category daitles"
                    })
                } else {
                    throw new CustomError("Sub Category not found", 404);
                }
            } else {
                throw new CustomError("Sub Category id is required", 400);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error getting sub category dailtes:", error.message);
        next(error)
    }
}

const getCategoryWiseSubCategory = async (req, res, next) => {
    try {
        const categoryId = req.body.categoryId;
        if (categoryId) {
            const categoryData = await Category.findOne({ _id: categoryId });
            if (categoryData) {
                const subCategoryData = await SubCategory.find({
                    categoryId: categoryId,
                });
                if (subCategoryData) {
                    res.status(200).send({
                        success: true,
                        data: subCategoryData,
                        message: "Retriving category wise sub category daitles"
                    })
                } else {
                    throw new CustomError("Sub Category not found", 404);
                }
            } else {
                throw new CustomError("Category not found", 404);
            }
        } else {
            throw new CustomError("Category id is required", 400);
        }
    } catch (error) {
        console.error("Error getting category wise sub category:", error.message);
        next(error)
    }
}

const createProduct = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const { productName, description, categoryId, subCategoryId } = req.body;
        const priceAndPack = JSON.parse(req.body.priceAndPack || "[]");
        const filename = req.file.filename;
        let productImage = `${process.env.BASE_IMG_URL}/Images/${filename}`;
        if (isAdmin) {
            if (!productName || !description || !categoryId || !subCategoryId || !filename) {
                throw new CustomError("All fields are required", 400);
            } else {
                if (priceAndPack.length < 0) {
                    throw new CustomError("Price and pack is required", 400);
                }
                const categoryData = await Category.findOne({
                    _id: categoryId
                })
                if (categoryData) {
                    const subCategoryData = await SubCategory.findOne({
                        _id: subCategoryId,
                        categoryId: categoryData._id
                    })
                    if (subCategoryData) {
                        const productData = await Product.create({
                            productName,
                            description,
                            packWithPrice: priceAndPack,
                            productImage,
                            categoryId: categoryData._id,
                            categoryName: categoryData.categoryName,
                            subCategoryId: subCategoryId,
                            subCategoryName: subCategoryData.subCategoryName
                        })
                        res.status(201).json({
                            data: productData,
                            message: "Product created successfully"
                        })
                    } else {
                        throw new CustomError("Sub Category not found", 404);
                    }
                } else {
                    throw new CustomError("Category not found", 404);
                }
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error creating product:", error.message);
        next(error)
    }
}

const updateProduct = async (req, res, next) => {
    try {
        const productId = req.body.productId
        const isAdmin = req.user.isAdmin;
        let packWithPrice;
        let productImage;
        if (isAdmin) {
            const productData = await Product.findOne({
                _id: productId
            });
            if (productData) {
                if (req.file) {
                    const filename = req.file.filename;
                    productImage = `${process.env.BASE_IMG_URL}/Images/${filename}`;
                } else {
                    productImage = productData.productImage
                }
                if (priceAndPack.length < 0) {
                    packWithPrice = productData.packWithPrice
                } else {
                    packWithPrice = req.body.priceAndPack
                }
                const updatedProduct = await Product.findOneAndUpdate({
                    _id: productId
                }, {
                    $set: {
                        productName: req.body.productName,
                        description: req.body.description,
                        packWithPrice: packWithPrice,
                        productImage: productImage
                    }
                }
                );
                res.status(200).json({
                    data: updatedProduct,
                    message: "Product updated successfully"
                })
            } else {
                throw new CustomError("Product not found", 404);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error updating product:", error.message);
        next(error)
    }
}

const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.body.productId;
        const isAdmin = req.user.isAdmin
        if (isAdmin) {
            const productData = await Product.findOne({
                _id: productId
            });
            if (productData) {
                await Product.findOneAndDelete({
                    _id: productId
                });
                res.status(200).json({
                    message: "Product deleted successfully"
                })
            } else {
                throw new CustomError("Product not found", 404);
            }
        } else {
            throw new CustomError("You are not authorized to perform this action", 401);
        }
    } catch (error) {
        console.error("Error deleting product:", error.message);
        next(error)
    }
}

const getAllProduct = async (req, res,next) => {
    try {
        const allProduct = await Product.find();
        if (!allProduct || allProduct.length === 0) {
            throw new CustomError("No products found", 404);
        }
        res.status(200).json({
            success: true,
            data: allProduct,
            count: allProduct.length,
            message: "All products retrieved successfully"
        })
    } catch (error) {
        console.error("Error retrieving products:", error.message);
        next(error)
    }
};

const getSingleProduct = async (req, res,next) => {
    try {
        const ProductId = req.body.productId
        const ProductData = await Product.findOne({
            _id: ProductId
        })
        if (ProductData) {
            console.log(ProductData);
            res.status(200).
                json({
                    success: true,
                    message: "Your Product Daitles....",
                    Product: ProductData
                })
        } else {
            throw new CustomError("Product not found", 404);
        }
    } catch (error) {
        console.error("Error retrieving product:", error.message);
        next(error)
    }
}

const getCatAndSubCatWiseProduct = async (req, res, next) => {
    try {
        const categoryId = req.body.categoryId
        const subCategoryId = req.body.subCategoryId
        if (categoryId) {
            const category = await Category.findOne({
                _id: categoryId
            });
            if (category) {
                const subCategoryData = await SubCategory.findOne({
                    categoryId: categoryId,
                    _id: subCategoryId
                })
                if (subCategoryData) {
                    const productData = await Product.find({
                        categoryId: categoryId,
                        subCategoryId: subCategoryId
                    })
                    if (productData) {
                        res.status(200).
                            json({
                                success: true,
                                message: "Your Product Daitles....",
                                productData: productData
                            })
                    } else {
                        throw new CustomError(
                            "Product isn't available",
                            400
                        )
                    }
                } else {
                    throw new CustomError(
                        "Sub Category is not available",
                        404
                    )
                }
            } else {
                throw new CustomError(
                    "Category is not available",
                    404
                )
            }
        } else {
            throw new CustomError(
                "Category Id is required",
                400
            );
        }
    } catch (error) {
        console.error("Error retrieving product category wise:", error.message);
        next(error)
    }
}

const getCategoryWiseProduct = async (req, res, next) => {
    try {
        const categoryId = req.body.categoryId;
        if (categoryId) {
            const categoryData = await Category.findOne({
                _id: categoryId
            });
            if (categoryData) {
                const productData = await Product.find({
                    categoryId: categoryId
                })
                if (productData) {
                    res.status(200).
                        json({
                            success: true,
                            message: "Your Product Daitles....",
                            productData: productData
                        })
                } else {
                    throw new CustomError(
                        "Product isn't available",
                        400
                    )
                }
            } else {
                throw new CustomError(
                    "Category is not available",
                    404
                )
            }
        } else {
            throw new CustomError(
                "Category Id is required",
                400
            )
        }
    } catch (error) {
        console.error("Error retrieving product category wise:", error.message);
        next(error)
    }
}

module.exports = {
    securePassword,
    NewUser,
    userLogin,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProduct,
    getCatAndSubCatWiseProduct,
    getSingleProduct,
    newCategory,
    getAllCategory,
    updateCategory,
    getCatDaitles,
    deleteCategory,
    addNewSubCategory,
    getAllSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getSubCategoryDaitles,
    getCategoryWiseSubCategory,
    getCategoryWiseProduct
}