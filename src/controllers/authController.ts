import { Request, Response } from "express";
import UserModel, { IUser } from "../models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ResponseCode } from "../lib/Utils/ResponseCode";
import { Res } from "../lib/datatype/common";
import cloudinary from "../lib/Utils/Cloundinary";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();


export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "school" | "instructor";
    schoolId?: string;
    phone?: string;
    address?: string;
    bio?: string;
    profileImage?: string;
    approved?: boolean;
  };
}

const createToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET ?? "",
    { expiresIn: "1d" }
  );
};


// Register User
const register = (req: Request, res: Response): void => {
  const {
    name,
    email,
    password,
    confirmPassword,
    role,
    schoolId,
    phone,
    address,
    bio,
  } = req.body;

  if (!password || !confirmPassword) {
    res.status(ResponseCode.BAD_REQUEST).json({
      status: false,
      message: "Password and confirm password are required",
    });
    return;
  }

  if (password !== confirmPassword) {
    res.status(ResponseCode.BAD_REQUEST).json({
      status: false,
      message: "Passwords do not match",
    });
    return;
  }

  UserModel.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        res.status(ResponseCode.CONFLICT).json({
          status: false,
          message: "Email already exists",
        });
        return Promise.reject("Email already exists");
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const userRole = role || "user";

      const newUser = new UserModel({
        name,
        email,
        password: hashedPassword,
        role: userRole,
        schoolId,
        phone,
        address,
        bio,
        approved: userRole === "user" ? true : undefined, // 👈 only "user" is manually approved
      });

      return newUser.save();
    })
    .then((user) => {
      res.status(ResponseCode.SUCCESS).json({
        status: true,
        message:
          user.role === "user" || user.role === "admin"
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
        res.status(ResponseCode.SERVER_ERROR).json({
          status: false,
          message: "Server error",
          error: error.message || error,
        });
      }
    });
};

// Login User
const login = (
  req: Request,
  res: Response<Res<{ token: string; user: Partial<IUser> }>>
): void => {
  const { email, password } = req.body;

  UserModel.findOne({ email })
    .then((user) => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        res.status(ResponseCode.UNAUTHORIZED).json({
          status: false,
          message: "Invalid credentials",
        });
        return Promise.reject("Invalid credentials");
      }

      return UserModel.findById(user._id);
    })
    .then((updatedUser) => {
      if (!updatedUser) {
        res.status(ResponseCode.UNAUTHORIZED).json({
          status: false,
          message: "Invalid credentials",
        });
        return Promise.reject("User not found");
      }

      if (
        (updatedUser.role === "instructor" || updatedUser.role === "school") &&
        updatedUser.approved !== true
      ) {
        res.status(ResponseCode.FORBIDDEN).json({
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

      res.status(ResponseCode.SUCCESS).json({
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
      if (
        error !== "Invalid credentials" &&
        error !== "Admin approval pending"
      ) {
        res
          .status(ResponseCode.SERVER_ERROR)
          .json({ status: false, message: "Server error" });
      }
    });
};

// Forgot Password
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  console.log(req.body);
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(ResponseCode.NOT_FOUND).json({
        status: false,
        message: "User with this email does not exist",
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Your App Name" <${process.env.SMTP_MAIL}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(ResponseCode.SUCCESS).json({
      status: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(ResponseCode.SERVER_ERROR).json({
      status: false,
      message: "Something went wrong while sending reset email",
    });
  }
};

// Reset Password
const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword || password !== confirmPassword) {
    res.status(ResponseCode.BAD_REQUEST).json({
      status: false,
      message: "Passwords do not match or are missing",
    });
    return;
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    // console.log("Received Token:", token); // Debugging
    // console.log("Hashed Token for lookup:", hashedToken);

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure number comparison
    });

    if (!user) {
      res.status(ResponseCode.BAD_REQUEST).json({
        status: false,
        message: "Invalid or expired token",
      });
      return;
    }

    user.password = await bcrypt.hash(password, 10); // Ensure async hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(ResponseCode.SUCCESS).json({
      status: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error); // Debugging
    res.status(ResponseCode.SERVER_ERROR).json({
      status: false,
      message: "Server error",
    });
  }
};

const approveUser = (req: AuthRequest, res: Response): void => {
  if (req.user?.role === "school") {
    res
      .status(ResponseCode.FORBIDDEN)
      .json({ status: false, message: "Unauthorized" });
    return;
  }

  const { userId } = req.params;

  UserModel.findById(userId)
    .then((user) => {
      if (!user) {
        res
          .status(ResponseCode.NOT_FOUND_ERROR)
          .json({ status: false, message: "User not found" });
        return Promise.reject("User not found");
      }

      // ❌ Prevent approval for 'user' role (they are auto-approved)
      if (user.role === "user") {
        res.status(ResponseCode.BAD_REQUEST).json({
          status: false,
          message: "Normal users do not require approval",
        });
        return Promise.reject("Normal user - no approval needed");
      }

      // ✅ Already approved
      if (user.approved) {
        res
          .status(ResponseCode.SUCCESS)
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
          .status(ResponseCode.SUCCESS)
          .json({ status: true, message: "User approved successfully" });
      }
    })
    .catch((error) => {
      if (
        error !== "User not found" &&
        error !== "User already approved" &&
        error !== "Normal user - no approval needed"
      ) {
        res
          .status(ResponseCode.SERVER_ERROR)
          .json({ status: false, message: "Error approving user" });
      }
    });
};

//  Reject User (Admin Only)
const rejectUserbyAdmin = (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== "admin") {
    res
      .status(ResponseCode.FORBIDDEN)
      .json({ status: false, message: "Unauthorized" });
    return;
  }

  const { userId } = req.params;

  UserModel.findById(userId)
    .then((user) => {
      if (!user) {
        res
          .status(ResponseCode.NOT_FOUND_ERROR)
          .json({ status: false, message: "User not found" });
        return Promise.reject("User not found");
      }

      // If already rejected, return success message
      if (user.approved === false) {
        res
          .status(ResponseCode.SUCCESS)
          .json({ status: true, message: "User is already rejected" });
        return Promise.reject("User already rejected");
      }

      // Reject the user (You can either update approval status or delete the user)
      return UserModel.findByIdAndDelete(userId);
    })
    .then((deletedUser) => {
      if (deletedUser) {
        res.status(ResponseCode.SUCCESS).json({
          status: true,
          message: "User rejected and removed successfully",
        });
      }
    })
    .catch((error) => {
      if (error !== "User not found" && error !== "User already rejected") {
        res
          .status(ResponseCode.SERVER_ERROR)
          .json({ status: false, message: "Error rejecting user" });
      }
    });
};

const getApprovedUsers = (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== "admin") {
    res
      .status(ResponseCode.FORBIDDEN)
      .json({ status: false, message: "Unauthorized" });
    return;
  }

  UserModel.find({ approved: true })
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

      res.status(ResponseCode.SUCCESS).json({
        status: true,
        data: filteredUsers,
        message: "Approved users fetched successfully",
      });
    })
    .catch((error) => {
      res
        .status(ResponseCode.SERVER_ERROR)
        .json({ status: false, message: "Error fetching users" });
    });
};

const getPendingUsers = (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== "admin") {
    res
      .status(ResponseCode.FORBIDDEN)
      .json({ status: false, message: "Unauthorized" });
    return;
  }

  UserModel.find({ approved: false })
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
        .status(ResponseCode.SUCCESS)
        .json({ status: true, data: filteredUsers });
    })
    .catch(() => {
      res
        .status(ResponseCode.SERVER_ERROR)
        .json({ status: false, message: "Error fetching pending users" });
    });
};

const RejectUsers = (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== "admin") {
    res
      .status(ResponseCode.FORBIDDEN)
      .json({ status: false, message: "Unauthorized" });
    return;
  }

  const { userId } = req.params;

  UserModel.findByIdAndDelete(userId)
    .then((deletedUser) => {
      if (!deletedUser) {
        res
          .status(ResponseCode.NOT_FOUND)
          .json({ status: false, message: "User not found" });
        return;
      }
      res
        .status(ResponseCode.SUCCESS)
        .json({ status: true, message: "User deleted successfully" });
    })
    .catch(() => {
      res
        .status(ResponseCode.SERVER_ERROR)
        .json({ status: false, message: "Error deleting user" });
    });
};

// Admin Creates Instructor, School, or Admin
// const createUserByAdmin = (req: AuthRequest, res: Response): void => {
//   if (req.user?.role !== "admin") {
//     res
//       .status(ResponseCode.FORBIDDEN)
//       .json({ status: false, message: "Unauthorized" });
//     return;
//   }

//   const { name, email, role, password } = req.body;

//   const allowedRoles = ["instructor", "school", "admin"];
//   if (!allowedRoles.includes(role)) {
//     res.status(ResponseCode.BAD_REQUEST).json({
//       status: false,
//       message: "Invalid role. Only 'admin', 'instructor', or 'school' allowed",
//     });
//     return;
//   }

//   if (!password || password.length < 6) {
//     res.status(ResponseCode.BAD_REQUEST).json({
//       status: false,
//       message: "Password is required and must be at least 6 characters",
//     });
//     return;
//   }

//   UserModel.findOne({ email })
//     .then((existingUser) => {
//       if (existingUser) {
//         res
//           .status(ResponseCode.CONFLICT)
//           .json({ status: false, message: "Email already exists" });
//         return Promise.reject("Email already exists");
//       }

//       const hashedPassword = bcrypt.hashSync(password, 10);
//       const user = new UserModel({
//         name,
//         email,
//         password: hashedPassword,
//         role,
//         // approved is handled by pre-save hook for 'admin'
//       });

//       return user.save();
//     })
//     .then((user) => {
//       res.status(ResponseCode.SUCCESS).json({
//         status: true,
//         message: `User with role '${role}' created successfully`,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           approved: user.approved,
//         },
//       });
//     })
//     .catch((error) => {
//       console.error("Error creating user by admin:", error); // 👈 log exact error
//       if (error !== "Email already exists") {
//         res
//           .status(ResponseCode.SERVER_ERROR)
//           .json({ status: false, message: "Server error" });
//       }
//     });
// };


// ✅ SMTP transporter using Gmail + App Password + Port 465 (secure SSL)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

// ✅ Admin creates Instructor, School, or Admin
export const createUserByAdmin = (req: AuthRequest, res: Response): void => {
  if (req.user?.role !== "admin") {
    res.status(ResponseCode.FORBIDDEN).json({
      status: false,
      message: "Unauthorized",
    });
    return;
  }

  const { name, email, role, password } = req.body;

  const allowedRoles = ["instructor", "school", "admin"];
  if (!allowedRoles.includes(role)) {
    res.status(ResponseCode.BAD_REQUEST).json({
      status: false,
      message: "Invalid role. Only 'admin', 'instructor', or 'school' allowed",
    });
    return;
  }

  if (!password || password.length < 6) {
    res.status(ResponseCode.BAD_REQUEST).json({
      status: false,
      message: "Password is required and must be at least 6 characters",
    });
    return;
  }

  UserModel.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        res.status(ResponseCode.CONFLICT).json({
          status: false,
          message: "Email already exists",
        });
        return Promise.reject("Email already exists");
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        role,
      });

      return user.save().then((savedUser) => {
        // ✅ Send credentials via email
        const mailOptions = {
          from: process.env.SMTP_MAIL,
          to: savedUser.email,
          subject: "Your White Petal LMS Account Credentials",
          html: `
            <p>Hello ${savedUser.name},</p>
            <p>Your account has been created by the admin.</p>
            <p><strong>Email:</strong> ${savedUser.email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${savedUser.role}</p>
            <br/>
            <p>You can now login to the platform.</p>
          `,
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            // console.error("Email sending failed:", err);
          } else {
            // console.log("Email sent:", info.response);
          }
        });

        res.status(ResponseCode.SUCCESS).json({
          status: true,
          message: `User with role '${role}' created successfully. Credentials sent to email.`,
          user: {
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            approved: savedUser.approved,
          },
        });
      });
    })
    .catch((error) => {
      console.error("Error creating user by admin:", error);
      if (error !== "Email already exists") {
        res
          .status(ResponseCode.SERVER_ERROR)
          .json({ status: false, message: "Server error" });
      }
    });
};





//Logout Controller
const logout = (req: Request, res: Response): void => {
  res.clearCookie("token");
  res
    .status(ResponseCode.SUCCESS)
    .json({ status: true, message: "Successfully logged out" });
};

const getUserProfile = (req: AuthRequest, res: Response<Res<IUser>>): void => {
  const { user } = req; // Extract the logged-in user from the token
  const { userId } = req.params; // Get userId from request params (for admin access)

  let query =
    user?.role === "admin" && userId ? { _id: userId } : { _id: user?.id };

  UserModel.findOne(query)
    .select("-password -token -__v")
    .then((user) => {
      if (!user) {
        res
          .status(ResponseCode.NOT_FOUND_ERROR)
          .json({ status: false, message: "User not found" });
        return Promise.reject("User not found");
      }

      res.status(ResponseCode.SUCCESS).json({
        status: true,
        data: user,
        message: "Profile fetched successfully",
      });
    })
    .catch((error) => {
      if (error !== "User not found") {
        res
          .status(ResponseCode.SERVER_ERROR)
          .json({ status: false, message: "Server error" });
      }
    });
};

// Update user profile
export const updateUserProfile = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(ResponseCode.UNAUTHORIZED).json({
      status: false,
      message: "User is not authenticated",
    });
    return;
  }


  const { name, email, address, phone } = req.body;
  const userId = req.params.userId;

  const updateData: any = { name, email, address, phone };

  // Admin can update any user
  if (req.user.role === "admin") {
    UserModel.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password -token -__v")
      .then((updatedUser) => {
        if (updatedUser) {
          // Custom order of fields in response
          const formattedUser = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            address: updatedUser.address,
            phone: updatedUser.phone,
            role: updatedUser.role,
            approved: updatedUser.approved,
            createdAt: updatedUser.createdOn,
            updatedAt: updatedUser.updatedOn,
          };

          res.status(ResponseCode.SUCCESS).json({
            status: true,
            data: formattedUser,
            message: "Profile updated successfully",
          });
        } else {
          res.status(ResponseCode.NOT_FOUND_ERROR).json({
            status: false,
            message: "User not found",
          });
        }
      })
      .catch(() => {
        res.status(ResponseCode.SERVER_ERROR).json({
          status: false,
          message: "Error updating user profile",
        });
      });
  } else {
    // Non-admin can only update their own profile
    if (userId !== req.user.id.toString()) {
      res.status(ResponseCode.FORBIDDEN).json({
        status: false,
        message: "You are not authorized to update another user's profile.",
      });
      return;
    }

    UserModel.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password -token -__v")
      .then((updatedUser) => {
        if (updatedUser) {
          // Custom order of fields in response
          const formattedUser = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            address: updatedUser.address,
            phone: updatedUser.phone,
            role: updatedUser.role,
            approved: updatedUser.approved,
            createdAt: updatedUser.createdOn,
            updatedAt: updatedUser.updatedOn,
          };

          res.status(ResponseCode.SUCCESS).json({
            status: true,
            data: formattedUser,
            message: "Profile updated successfully",
          });
        } else {
          res.status(ResponseCode.NOT_FOUND_ERROR).json({
            status: false,
            message: "User not found",
          });
        }
      })
      .catch(() => {
        res.status(ResponseCode.SERVER_ERROR).json({
          status: false,
          message: "Server error",
        });
      });
  }
}; 

export default {
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
