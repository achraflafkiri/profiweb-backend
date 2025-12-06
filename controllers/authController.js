const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const ms = require('ms');
const nodemailer = require('nodemailer');

// Helper function to generate JWT token and send response
const passport = async (user, res) => {
  try {
    const expiresInMs = ms(process.env.JWTEXPIRESDELAI);
    const expiresInSeconds = expiresInMs / 1000;

    const token = jwt.sign({
      id: user._id,
      role: user.role ?? "parent"
    }, process.env.JWT_SECRET, {
      expiresIn: expiresInSeconds,
    });

    const expiresAt = new Date(Date.now() + expiresInMs);

    res.status(200).json({
      success: true,
      token: token,
      expiresIn: expiresInSeconds,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        photo: user.photo,
        age: user.age,
        status: user.status,
        profession: user.profession,
        hobbies: user.hobbies,
        children: user.children,
        childrenAges: user.childrenAges,
        custody: user.custody,
        custodyDetails: user.custodyDetails,
        conductAgreement: user.conductAgreement,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        updatedAt: user.updatedAt,
        latitude: user.latitude,
        longitude: user.longitude
      }
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const register = catchAsync(async (req, res, next) => {
  console.log("============== register ==============");

  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      age,
      status,
      profession,
      hobbies,
      children,
      childrenAges,
      custody,
      custodyDetails,
      conductAgreement,
      bio
    } = req.body;

    console.log(req.body, "<==");

    // Check for required fields
    if (!username || !email || !password || !firstName || !lastName || !phone || !age || !status) {
      return next(new AppError("All required fields must be provided: username, email, password, firstName, lastName, phone, age, status", 400));
    }

    // Validate status enum
    const validStatuses = ['célibataire', 'en couple', 'divorcée'];
    if (!validStatuses.includes(status)) {
      return next(new AppError("Status must be célibataire, en couple, or divorcée", 400));
    }

    // Validate children-related fields
    if (children > 0) {
      if (!custody) {
        return next(new AppError("Custody information is required when you have children", 400));
      }
      if (custody === 'autre' && !custodyDetails) {
        return next(new AppError("Custody details are required when custody type is 'autre'", 400));
      }
      if (!childrenAges || childrenAges.length !== children) {
        return next(new AppError("Number of children ages must match number of children", 400));
      }
    }

    // Validate conduct agreement
    // if (!conductAgreement) {
    //   return next(new AppError("Community conduct agreement must be accepted", 400));
    // }

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(username) || await User.findByEmailOrUsername(email);
    if (existingUser) {
      return next(new AppError("User with this username or email already exists", 400));
    }

    // Create user data object
    const userData = {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      age,
      status,
      children: children || 0,
      conductAgreement: conductAgreement ? conductAgreement : true,
      role: 'parent' // Default role
    };

    // Add optional fields if provided
    if (profession) userData.profession = profession;
    if (bio) userData.bio = bio;
    if (hobbies && hobbies.length > 0) userData.hobbies = hobbies;
    if (children > 0) {
      userData.childrenAges = childrenAges;
      userData.custody = custody;
      if (custody === 'autre' && custodyDetails) {
        userData.custodyDetails = custodyDetails;
      }
    }

    // Create new user
    const user = await User.create(userData);

    console.log("New user created => ", user);

    // Generate token and send response
    await passport(user, res);
  } catch (error) {
    console.error(error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation Error: ${errors.join('. ')}`, 400));
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return next(new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`, 400));
    }

    next(error);
  }
});

// Login function
const login = catchAsync(async (req, res, next) => {
  console.log("============== login ==============");

  try {
    const { emailOrUsername, password } = req.body;

    console.log(req.body, "<==");

    // Check for required fields
    if (!emailOrUsername || !password) {
      return next(new AppError("Email/username and password are required", 400));
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(emailOrUsername);

    console.log(user, "==user");

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated. Please contact support", 401));
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid credentials", 401));
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token and send response
    await passport(user, res);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Configure your email transporter (put this at the top of your file)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",       // e.g., 'smtp.gmail.com'
  port: 465,      // e.g., 465 for SSL
  secure: true,                      // true for 465, false for other ports
  auth: {
    user: "achraf.lafkiri.2@gmail.com", // your email address
    pass: "qrhekrlasitvhbsd"  // your email password or app password
  }
});

// Send 4 digits code to email
const sendCode = async (req, res, next) => {
  console.log("============== sendCode ==============");
  try {
    const { email } = req.body;

    // Check for required fields
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    // Try to find existing user
    const user = await User.findOne({ email });

    console.log("user ==> ", user);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Generate 4 digits code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Save the code to the user document (optional but recommended)
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save({ validateBeforeSave: false });

    // Email options
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Password Reset Verification</h2>
          <p>Hello ${user.firstName || 'there'},</p>
          <p>We received a request to reset your password. Please use the following verification code:</p>
          <div style="background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Your App Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      // Don't send the code in response in production
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error(error);

    // Reset the verification code if email fails
    // if (user) {
    //   user.verificationCode = undefined;
    //   user.verificationCodeExpires = undefined;
    //   await user.save({ validateBeforeSave: false });
    // }

    return next(new AppError('There was an error sending the email. Please try again later.', 500));
  }
}

// Verify 4-digit code
const verifyCode = async (req, res, next) => {
  console.log("============== verifyCode ==============");
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(new AppError("Email and code are required", 400));
    }

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError("Invalid or expired verification code", 400));
    }

    // Generate a temporary token for password reset (valid for 10 minutes)
    const tempToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      success: true,
      message: "Code verified successfully",
      tempToken // Send this token to allow password reset
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

// Reset password after verification
const resetPassword = async (req, res, next) => {
  console.log("============== resetPassword ==============");
  try {
    const { tempToken, newPassword } = req.body;

    if (!tempToken || !newPassword) {
      return next(new AppError("Token and new password are required", 400));
    }

    // Verify the temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    if (decoded.purpose !== 'password_reset') {
      return next(new AppError("Invalid token purpose", 400));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Update password
    user.password = newPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError("Reset token has expired", 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError("Invalid token", 401));
    }
    console.error(error);
    next(error);
  }
}

// Don't forget to export the new functions
module.exports = {
  sendCode,
  verifyCode,
  resetPassword,
  login,
  register
};
