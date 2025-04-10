"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("../models/user"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ResponseCode_1 = require("../lib/Utils/ResponseCode");
const Cloundinary_1 = __importDefault(require("../lib/Utils/Cloundinary"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const createToken = (user) => {
    var _a;
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "", { expiresIn: "1d" });
};
// Register User
const register = (req, res) => {
    const { name, email, password, confirmPassword, role, schoolId, phone, address, bio, } = req.body;
    if (!password || !confirmPassword) {
        res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
            status: false,
            message: "Password and confirm password are required",
        });
        return;
    }
    if (password !== confirmPassword) {
        res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
            status: false,
            message: "Passwords do not match",
        });
        return;
    }
    user_1.default.findOne({ email })
        .then((existingUser) => {
        if (existingUser) {
            res.status(ResponseCode_1.ResponseCode.CONFLICT).json({
                status: false,
                message: "Email already exists",
            });
            return Promise.reject("Email already exists");
        }
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const userRole = role || "user";
        const isNormalUser = userRole === "user";
        const user = new user_1.default({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            schoolId,
            phone,
            address,
            bio,
            approved: isNormalUser ? true : false, // 👈 auto-approve only normal users
        });
        return user.save();
    })
        .then((user) => {
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            message: user.role === "user"
                ? "Registration successful."
                : "Registration successful. Awaiting admin approval.",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                phone: user.phone,
                address: user.address,
                bio: user.bio,
                approved: user.approved,
            },
        });
    })
        .catch((error) => {
        if (error !== "Email already exists") {
            res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
                status: false,
                message: "Server error",
                error: error.message || error,
            });
        }
    });
};
// Login User
const login = (req, res) => {
    const { email, password } = req.body;
    user_1.default.findOne({ email })
        .then((user) => {
        if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
            res.status(ResponseCode_1.ResponseCode.UNAUTHORIZED).json({
                status: false,
                message: "Invalid credentials",
            });
            return Promise.reject("Invalid credentials");
        }
        return user_1.default.findById(user._id);
    })
        .then((updatedUser) => {
        if (!updatedUser) {
            res.status(ResponseCode_1.ResponseCode.UNAUTHORIZED).json({
                status: false,
                message: "Invalid credentials",
            });
            return Promise.reject("User not found");
        }
        if ((updatedUser.role === "instructor" ||
            updatedUser.role === "school") &&
            updatedUser.approved !== true) {
            res.status(ResponseCode_1.ResponseCode.FORBIDDEN).json({
                status: false,
                message: "Admin approval pending.",
            });
            return Promise.reject("Admin approval pending");
        }
        const token = createToken(updatedUser);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            data: {
                token,
                user: {
                    id: updatedUser._id,
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profileImage: updatedUser.profileImage,
                    approved: updatedUser.approved,
                },
            },
            message: "Login successful",
        });
    })
        .catch((error) => {
        if (error !== "Invalid credentials" &&
            error !== "Admin approval pending") {
            res
                .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                .json({ status: false, message: "Server error" });
        }
    });
};
// Forgot Password
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(ResponseCode_1.ResponseCode.NOT_FOUND).json({
                status: false,
                message: "User with this email does not exist",
            });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Store as number for compatibility
        yield user.save({ validateBeforeSave: false });
        // console.log("Reset Token:", resetToken); // Debugging
        // console.log("Hashed Token:", hashedToken);
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: user.email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click the link to reset: ${process.env.CLIENT_URL}/reset-password/${resetToken}`,
        };
        const info = yield transporter.sendMail(mailOptions);
        // console.log("Email sent: ", info.response);
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            message: "Password reset link sent to your email.",
        });
    }
    catch (error) {
        console.error("Error in forgotPassword:", error); // Debugging
        res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
            status: false,
            message: "Server error",
        });
    }
});
// Reset Password
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword || password !== confirmPassword) {
        res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
            status: false,
            message: "Passwords do not match or are missing",
        });
        return;
    }
    try {
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        // console.log("Received Token:", token); // Debugging
        // console.log("Hashed Token for lookup:", hashedToken);
        const user = yield user_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }, // Ensure number comparison
        });
        if (!user) {
            res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
                status: false,
                message: "Invalid or expired token",
            });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(password, 10); // Ensure async hashing
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save({ validateBeforeSave: false });
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            message: "Password reset successful",
        });
    }
    catch (error) {
        console.error("Error in resetPassword:", error); // Debugging
        res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
            status: false,
            message: "Server error",
        });
    }
});
const approveUser = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "school") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    const { userId } = req.params;
    user_1.default.findById(userId)
        .then((user) => {
        if (!user) {
            res
                .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                .json({ status: false, message: "User not found" });
            return Promise.reject("User not found");
        }
        // ❌ Prevent approval for 'user' role (they are auto-approved)
        if (user.role === "user") {
            res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
                status: false,
                message: "Normal users do not require approval",
            });
            return Promise.reject("Normal user - no approval needed");
        }
        // ✅ Already approved
        if (user.approved) {
            res
                .status(ResponseCode_1.ResponseCode.SUCCESS)
                .json({ status: true, message: "User is already approved" });
            return Promise.reject("User already approved");
        }
        // ✅ Approve the user
        user.approved = true;
        return user.save();
    })
        .then((updatedUser) => {
        if (updatedUser) {
            res
                .status(ResponseCode_1.ResponseCode.SUCCESS)
                .json({ status: true, message: "User approved successfully" });
        }
    })
        .catch((error) => {
        if (error !== "User not found" &&
            error !== "User already approved" &&
            error !== "Normal user - no approval needed") {
            res
                .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                .json({ status: false, message: "Error approving user" });
        }
    });
};
//  Reject User (Admin Only)
const rejectUserbyAdmin = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    const { userId } = req.params;
    user_1.default.findById(userId)
        .then((user) => {
        if (!user) {
            res
                .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                .json({ status: false, message: "User not found" });
            return Promise.reject("User not found");
        }
        // If already rejected, return success message
        if (user.approved === false) {
            res
                .status(ResponseCode_1.ResponseCode.SUCCESS)
                .json({ status: true, message: "User is already rejected" });
            return Promise.reject("User already rejected");
        }
        // Reject the user (You can either update approval status or delete the user)
        return user_1.default.findByIdAndDelete(userId);
    })
        .then((deletedUser) => {
        if (deletedUser) {
            res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
                status: true,
                message: "User rejected and removed successfully",
            });
        }
    })
        .catch((error) => {
        if (error !== "User not found" && error !== "User already rejected") {
            res
                .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                .json({ status: false, message: "Error rejecting user" });
        }
    });
};
const getApprovedUsers = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    user_1.default.find({ approved: true })
        .then((users) => {
        const filteredUsers = users.map((user) => ({
            id: user._id, // Rename _id to id
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            // profileImage: user.profileImage,
            approved: user.approved,
            // createdOn: user.createdOn,
        }));
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            data: filteredUsers,
            message: "Approved users fetched successfully",
        });
    })
        .catch((error) => {
        res
            .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
            .json({ status: false, message: "Error fetching users" });
    });
};
const getPendingUsers = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    user_1.default.find({ approved: false })
        .then((users) => {
        const filteredUsers = users.map((user) => ({
            id: user._id, // Rename _id to id
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            // profileImage: user.profileImage,
            approved: user.approved,
            // createdOn: user.createdOn,
        }));
        res
            .status(ResponseCode_1.ResponseCode.SUCCESS)
            .json({ status: true, data: filteredUsers });
    })
        .catch(() => {
        res
            .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
            .json({ status: false, message: "Error fetching pending users" });
    });
};
const RejectUsers = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    const { userId } = req.params;
    user_1.default.findByIdAndDelete(userId)
        .then((deletedUser) => {
        if (!deletedUser) {
            res
                .status(ResponseCode_1.ResponseCode.NOT_FOUND)
                .json({ status: false, message: "User not found" });
            return;
        }
        res
            .status(ResponseCode_1.ResponseCode.SUCCESS)
            .json({ status: true, message: "User deleted successfully" });
    })
        .catch(() => {
        res
            .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
            .json({ status: false, message: "Error deleting user" });
    });
};
// Admin Creates Instructor or School
const createUserByAdmin = (req, res) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res
            .status(ResponseCode_1.ResponseCode.FORBIDDEN)
            .json({ status: false, message: "Unauthorized" });
        return;
    }
    const { name, email, role } = req.body;
    if (role !== "instructor" && role !== "school") {
        res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
            status: false,
            message: "Invalid role. Only 'instructor' or 'school' allowed",
        });
        return;
    }
    user_1.default.findOne({ email })
        .then((existingUser) => {
        if (existingUser) {
            res
                .status(ResponseCode_1.ResponseCode.CONFLICT)
                .json({ status: false, message: "Email already exists" });
            return Promise.reject("Email already exists");
        }
        const hashedPassword = bcryptjs_1.default.hashSync(req.body.password || email, 10);
        const user = new user_1.default({
            name,
            email,
            password: hashedPassword,
            role,
            approved: true, // ✅ Auto-approve when created by admin
        });
        return user.save();
    })
        .then((user) => {
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            message: "User created successfully",
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                approved: user.approved,
            },
        });
    })
        .catch((error) => {
        if (error !== "Email already exists") {
            res
                .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                .json({ status: false, message: "Server error" });
        }
    });
};
//Logout Controller
const logout = (req, res) => {
    res.clearCookie("token");
    res
        .status(ResponseCode_1.ResponseCode.SUCCESS)
        .json({ status: true, message: "Successfully logged out" });
};
const getUserProfile = (req, res) => {
    const { user } = req; // Extract the logged-in user from the token
    const { userId } = req.params; // Get userId from request params (for admin access)
    let query = (user === null || user === void 0 ? void 0 : user.role) === "admin" && userId ? { _id: userId } : { _id: user === null || user === void 0 ? void 0 : user.id };
    user_1.default.findOne(query)
        .select("-password -token -__v")
        .then((user) => {
        if (!user) {
            res
                .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                .json({ status: false, message: "User not found" });
            return Promise.reject("User not found");
        }
        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
            status: true,
            data: user,
            message: "Profile fetched successfully",
        });
    })
        .catch((error) => {
        if (error !== "User not found") {
            res
                .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                .json({ status: false, message: "Server error" });
        }
    });
};
// Update user profile
const updateUserProfile = (req, res) => {
    if (!req.user) {
        res
            .status(ResponseCode_1.ResponseCode.UNAUTHORIZED)
            .json({ status: false, message: "User is not authenticated" });
        return;
    }
    const { name, email } = req.body;
    const userId = req.params.userId;
    if (req.user.role === "admin") {
        let updateData = { name, email };
        if (req.file) {
            Cloundinary_1.default.uploader
                .upload(req.file.path, { folder: "profiles" })
                .then((cloudinaryRes) => {
                updateData.profileImage = cloudinaryRes.secure_url;
                user_1.default.findByIdAndUpdate(userId, updateData, { new: true })
                    .select("-password -token -__v")
                    .then((updatedUser) => {
                    if (updatedUser) {
                        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
                            status: true,
                            data: updatedUser,
                            message: "Profile updated successfully",
                        });
                    }
                    else {
                        res
                            .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                            .json({ status: false, message: "User not found" });
                    }
                })
                    .catch(() => {
                    res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
                        status: false,
                        message: "Error updating user profile",
                    });
                });
            })
                .catch(() => {
                res
                    .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                    .json({ status: false, message: "Error uploading image" });
            });
        }
        else {
            user_1.default.findByIdAndUpdate(userId, updateData, { new: true })
                .select("-password -token -__v")
                .then((updatedUser) => {
                if (updatedUser) {
                    res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
                        status: true,
                        data: updatedUser,
                        message: "Profile updated successfully",
                    });
                }
                else {
                    res
                        .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                        .json({ status: false, message: "User not found" });
                }
            })
                .catch(() => {
                res
                    .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                    .json({ status: false, message: "Server error" });
            });
        }
    }
    else {
        // Non-admin users (Instructors, Schools) can only update their own profile
        if (userId !== req.user.id.toString()) {
            res.status(ResponseCode_1.ResponseCode.FORBIDDEN).json({
                status: false,
                message: "You are not authorized to update another user's profile.",
            });
            return;
        }
        let updateData = { name, email };
        if (req.file) {
            Cloundinary_1.default.uploader
                .upload(req.file.path, { folder: "profiles" })
                .then((cloudinaryRes) => {
                updateData.profileImage = cloudinaryRes.secure_url;
                user_1.default.findByIdAndUpdate(userId, updateData, { new: true })
                    .select("-password -token -__v")
                    .then((updatedUser) => {
                    if (updatedUser) {
                        res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
                            status: true,
                            data: updatedUser,
                            message: "Profile updated successfully",
                        });
                    }
                    else {
                        res
                            .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                            .json({ status: false, message: "User not found" });
                    }
                })
                    .catch(() => {
                    res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
                        status: false,
                        message: "Error updating user profile",
                    });
                });
            })
                .catch(() => {
                res
                    .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                    .json({ status: false, message: "Error uploading image" });
            });
        }
        else {
            // Update profile without image
            user_1.default.findByIdAndUpdate(userId, updateData, { new: true })
                .select("-password -token -__v")
                .then((updatedUser) => {
                if (updatedUser) {
                    res.status(ResponseCode_1.ResponseCode.SUCCESS).json({
                        status: true,
                        data: updatedUser,
                        message: "Profile updated successfully",
                    });
                }
                else {
                    res
                        .status(ResponseCode_1.ResponseCode.NOT_FOUND_ERROR)
                        .json({ status: false, message: "User not found" });
                }
            })
                .catch(() => {
                res
                    .status(ResponseCode_1.ResponseCode.SERVER_ERROR)
                    .json({ status: false, message: "Server error" });
            });
        }
    }
};
exports.default = {
    register,
    login,
    forgotPassword,
    resetPassword,
    getUserProfile,
    approveUser,
    rejectUserbyAdmin,
    getApprovedUsers,
    getPendingUsers,
    RejectUsers,
    createUserByAdmin,
    logout,
    updateUserProfile,
};
