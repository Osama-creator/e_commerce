const asyncWrapper = require("../middleware/asyncWrapper");
const User = require('../models/user_model');
const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const generateJWT = require("../utils/jwtHelper");

const getAllUsers = asyncWrapper(async (req,res) => {
    const query = req.query;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    // get all courses) from DB using Course Model
    const users = await User.find({}, {"__v": false, 'password': false}).limit(limit).skip(skip);

    res.json({ status: httpStatusText.SUCCESS, data: {users}});
})


const register = asyncWrapper(async (req, res, next) => {
    const { firstName, lastName,phone, email, password, role } = req.body;
    const oldUserwithEmail = await User.findOne({ email: email});
    const oldUserwithPhone = await User.findOne({ phone: phone});
    if( oldUserwithEmail || oldUserwithPhone) {
        const error = appError.create('user already exists', 400, httpStatusText.FAIL)
        return next(error);
    }
    // password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        firstName,
        lastName,
        phone,
        email,
        password: hashedPassword,
        role,
        avatar: req.file.filename
    })

    // generate JWT token 
    const token = await generateJWT({email: newUser.email, id: newUser._id, role: newUser.role});
    newUser.token = token;
    await newUser.save();
    res.status(201).json({status: httpStatusText.SUCCESS, data: {user: newUser}})
})


const login = asyncWrapper(async (req, res, next) => {
    const { email, phone, password } = req.body;
    if (!password || (!email && !phone)) {
        const error = appError.create('email/phone and password are required', 400, httpStatusText.FAIL);
        return next(error);
    }
    // Find user by email or phone number
    const user = await User.findOne({
        $or: [
            { email: email },
            { phone: phone }
        ]
    });
    if (!user) {
        const error = appError.create('user not found', 400, httpStatusText.FAIL);
        return next(error);
    }
    const matchedPassword = await bcrypt.compare(password, user.password);
    if (user && matchedPassword) {
        // logged in successfully
        const token = await generateJWT({ email: user.email, id: user._id, role: user.role });
        return res.json({ status: httpStatusText.SUCCESS, data: { user, token } });
    } else {
        const error = appError.create('invalid credentials', 401, httpStatusText.ERROR);
        return next(error);
    }
});
// Update user account
const updateUser = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;
    const { firstName, lastName, phone, email } = req.body;
    // Extract the user_id from the decoded token in the request
    const currentUserId = req.currentUser.user_id;
    console.log(currentUserId);
    // Check if the user is trying to update their own account
    if (userId !== currentUserId) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }

    // Proceed with the update if the user is authorized
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { firstName, lastName, phone, email },
        { new: true, runValidators: true } // Ensure validation runs during update
    );

    if (!updatedUser) {
        const error = appError.create('User not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    res.json({
        status: httpStatusText.SUCCESS,
        data: { user: updatedUser },
    });
});
const getAllDeleviry = asyncWrapper(async (req, res) => {
    const query = req.query;
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    // get all courses) from DB using Course Model
    const users = await User.find({role: 'DELEVIRY'}, {"__v": false, 'password': false}).limit(limit).skip(skip);
    res.json({ status: httpStatusText.SUCCESS, data: {delivery: users}});
})
// Delete user account
const deleteUser = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;

    // Extract the user_id from the decoded token in the request
    const currentUserId = req.currentUser.user_id;

    // Check if the user is trying to delete their own account
    if (userId !== currentUserId) {
        const error = appError.create('Unauthorized action', 403, httpStatusText.FAIL);
        return next(error);
    }

    // Proceed with deleting the user if the user is authorized
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        const error = appError.create('User not found', 400, httpStatusText.FAIL);
        return next(error);
    }

    res.json({
        status: httpStatusText.SUCCESS,
        message: 'User account deleted successfully',
    });
});

module.exports = {
    getAllDeleviry,
    getAllUsers,
    register,
    login,
    updateUser,
    deleteUser
};
