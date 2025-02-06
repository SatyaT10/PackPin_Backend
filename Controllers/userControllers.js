const User = require('../Model/UserModal');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CustomError = require('../error/CustomError');
const { securePassword } = require('./adminControllers');
const activeOtps = new Map();

function generateOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 15 * 60 * 1000;
    activeOtps.set(email, { otp, expiresAt });
    console.log(`Generated OTP for ${email}: ${otp} (Valid for 15 minutes)`);
    setTimeout(() => {
        activeOtps.delete(email);

        console.log(`OTP for ${email} has expired.`);
    }, 15 * 60 * 1000);
    return otp;
}

function verifyOtp(email, inputOtp) {
    const otpDetails = activeOtps.get(email);
    if (Date.now() > otpDetails.expiresAt) {
        activeOtps.delete(email);
        return { success: false, message: "OTP has expired." };
    }
    if (!otpDetails) {
        return { success: false, message: "OTP expired or not found" };
    }
    if (otpDetails.otp === parseInt(inputOtp)) {
        activeOtps.delete(email);
        return { success: true, message: "OTP verified successfully" };
    } else {
        return { success: false, message: "Invalid OTP" };
    }
}


const sendResetPasswordMail = async (name, email, otp) => {
    try {
        console.log("hOst->", process.env.SMTP_HOST, "-", "USER->", process.env.SMTP_USER, "--", "Password->", process.env.SMTP_PASSWORD);

        const transporter = nodemailer.createTransport({
            host: 'live.smtp.mailtrap.io',
            //process.env.SMTP_HOST,
            port: 587,
            secure: false, // or 'STARTTLS'
            auth: {
                user: 'smtp@mailtrap.io',
                //process.env.SMTP_USER,
                pass: 'e2615854c9ae5998571b2d5435176c55'
                // process.env.SMTP_PASSWORD
            },
        });
        const mailOptions = {
            from: process.env.SMTP_EMAIL_USER,
            to: email,
            subject: 'For reset your password',
            html: `<p>Hi <strong>${name}</strong>,</p>
        <p>You recently requested to reset your password. Please use the following OTP to complete the process:</p>
        <h2 style="color: #4CAF50;">${otp}</h2>
        <p><strong>Note:</strong> This OTP is valid for the next <strong>15 minutes</strong>. If it expires, you will need to request a new one.</p>
        <p>If you did not request a password reset, please ignore this email or contact our support team for assistance.</p>
        <p>Thank you,<br>The <b>Printkendra Team</b></p>`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error.message);
            }
            else {
                console.log("Email has been sent:-", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const userRegister = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password || !phone) {
            throw new CustomError('Please fill all the fields', 400);
        } else {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new CustomError('User already exists', 400);
            } else {
                const hashedPassword = await bcrypt.hash(password, 10)
                const user = new User({
                    name,
                    email,
                    password: hashedPassword,
                    whatsAppNo: phone,
                });
                await user.save();
            }
            res.status(201).json({ message: 'User created successfully', token });
        }
    } catch (error) {
        console.error("Error getting when User wants to register:", error.message);
        next(error)
    }
};

const userLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new CustomError('Please fill all the fields', 400);
        } else {
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                throw new CustomError(
                    'Invalid email or password. Please try again.',
                    401
                );
            } else {
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    throw new CustomError(
                        'Invalid email or password. Please try again.',
                        401
                    );
                } else {
                    const userData = {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.whatsAppNo,
                    }
                    const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIREIN });
                    res.status(200).json({
                        success: true,
                        message: 'User logged in successfully',
                        token,
                        userData: userData
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error getting when User wants to login:", err.message);
        next(err)
    }
}

const updateUserProfile = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const userId = req.user.id;
        const user_id = req.body.userId;
        const fUserId = userId || user_id
        const { name, phone } = req.body;
        const userDaitle = await User.findOne({
            _id: fUserId
        })
        if (userDaitle) {
            if (isAdmin) {
                const userDaitles = await User.findOneAndUpdate({
                    _id: fUserId
                }, req.body, { new: true, fields: { password: 0 } });
                res.status(200).
                    json({
                        status: true,
                        message: "Profile Updated Successfully",
                        userDaitles
                    })
            } else if (userId) {
                if (!name || !phone) {
                    throw new CustomError("Please fill in all fields", 400)
                } else {
                    userDaitle.name = name;
                    userDaitle.phone = phone;
                    await userDaitle.save();
                    res.status(200).
                        json({
                            status: true,
                            message: "Profile Updated Successfully",
                        })
                }
            }
        } else {
            throw new CustomError("User not found", 404)
        }
    } catch (error) {
        console.error("Error when user want to update his profile:", error.message);
        next(error)
    }
}

const changePassword = async (req, res, next) => {
    try {
        const email = req.user.email;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new CustomError("Please fill all the fields", 400);
        }
        const userData = await User.findOne({
            email: email
        });
        if (userData) {
            const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
            if (passwordMatch) {
                const hashedPassword = await securePassword(newPassword, 10);
                userData.password = hashedPassword;
                await userData.save();
                res.status(201).json({
                    success: true,
                    message: "Password Changed Successfully"
                });
            } else {
                throw new CustomError("Old Password is Wrong!", 401);
            }
        } else {
            throw new CustomError("User not found", 404);
        }
    } catch (error) {
        console.error("Error changing password:", error.message);
        next(error)
    }
}

const forgetPassword = async (req, res, next) => {
    try {
        const email = req.body.email;
        if (!email) {
            throw new CustomError("Please provide email", 400)
        }
        const userDaitle = await User.findOne({
            email: email
        });
        if (userDaitle) {
            const otp = generateOtp(email);
            console.log(otp);
            await sendResetPasswordMail(userDaitle.name, email, otp);
            res.status(200).json({
                status: true,
                message: "Please check your mail for otp and reset your password",
            })
        } else {
            throw new CustomError("User not found", 404)
        }
    } catch (error) {
        console.error("Error when forgot password hit:", error.message);
        next(error)
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { otp, newPassword, email } = req.body;
        if (!otp || !newPassword || !email) {
            throw new CustomError("Please fill all the requried fields", 400)
        }
        const userDaitle = await User.findOne({
            email: email
        })
        if (userDaitle) {
            const otpIsValid = verifyOtp(email, otp)

            console.log(otpIsValid);
            if (otpIsValid.success == true) {
                const hashedPassword = await securePassword(newPassword)
                userDaitle.password = hashedPassword;
                await userDaitle.save();
                res.status(200).
                    json({
                        status: true,
                        message: "Password Reset Successfully",
                    })
            } else {
                throw new CustomError(`${otpIsValid.message}`, 400)
            }
        } else {
            throw new CustomError("User not found", 404)
        }
    } catch (error) {
        console.error("Error trying to reset password:", error.message);
        next(error)
    }
}

const getAllUsers = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        if (isAdmin == 1) {
            const users = await User.find()
            res.status(200).json({
                success: true,
                users: users
            });
        }
        else {
            throw new CustomError("You are not authorized to view all users", 401);
        }
    } catch (error) {
        console.error("Error when admin try to get all usres:", error.message);
        next(error)
    }
}

const getUserDaitles = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const userId = req.user.userId;
        const user_id = req.body.userId;
        const fUserId = userId || user_id
        if (isAdmin || userId) {
            if (fUserId) {
                const userDaitle = await User.findOne({ _id: fUserId });
                if (userDaitle) {
                    res.status(200).json({
                        status: true,
                        message: "User Daitle",
                        data: userDaitle
                    })
                }
            } else {
                throw new CustomError("User not found", 404)
            }
        } else {
            throw new CustomError("You are not authorized to access this route", 403)
        }
    } catch (error) {
        console.error("Error getting user details :", error.message);
        next(error)
    }
}

const insertUserData = async (req, res, next) => {
    try {
        const isAdmin = req.user.isAdmin;
        const userId = req.user.userId;
        const user_id = req.body.userId;
        const fUserId = userId || user_id
        const userDaitle = await User.findOne({
            _id: fUserId
        })
        if (userDaitle) {
            if (isAdmin) {
                const userDaitles = await User.findOneAndUpdate({
                    _id: fUserId
                }, req.body, { new: true });
                res.status(200).
                    json({
                        status: true,
                        message: "Profile Updated Successfully",
                        userDaitles
                    })
            } else if (userId) {
                const { businessName, state, city, pinCode, GSTNumber, address } = req.body;
                if (!address || !pinCode || !city || !state || !country || !businessName) {
                    throw new CustomError("Please fill all the requried fields", 400);
                } else {
                    const lastUser = await User.findOne({}, {}, { sort: { user_id: -1 } });
                    
                    const newUserId = lastUser ? Number(lastUser.user_id) + 1 : 1;
                    console.log(newUserId);
                    
                    const formattedUserId = newUserId < 10000 ? String(newUserId).padStart(4, '0') : String(newUserId);
                    console.log(formattedUserId);
                    
                    userDaitle.businessName = businessName;
                    userDaitle.state = state;
                    userDaitle.city = city;
                    userDaitle.pinCode = pinCode;
                    userDaitle.GSTNumber = GSTNumber;
                    userDaitle.address = address;
                    userDaitle.user_id = formattedUserId
                    await userDaitle.save();
                    res.status(200).
                        json({
                            status: true,
                            message: "Profile Updated Successfully",
                        })
                }
            } else {
                throw new CustomError("Wrong request!", 400)
            }
        } else {
            throw new CustomError("User not found", 403)
        }
    } catch (error) {
        console.error("Error inserting user data:", error.message);
        next(error)
    }
}

module.exports = {
    userRegister,
    userLogin,
    updateUserProfile,
    changePassword,
    forgetPassword,
    resetPassword,
    getAllUsers,
    getUserDaitles,
    insertUserData
};