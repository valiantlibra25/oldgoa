import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";
import { options } from "../utils/constants.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname } = req.body;

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.file.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    avatar: {
      localPath: avatarLocalPath,
      url: avatar.url,
    },
    email,
    username,
    fullname,
    password,
  });

  const token = user.generateTemporaryToken();

  user.emailVerificationToken = token.hashedToken;
  user.emailVerificationExpiry = token.tokenExpiry;

  await user.save();

  await sendEmail({
    email,
    subject: "Verify your Email",
    mailgenContent: emailVerificationMailgenContent(
      username,
      `${process.env.BASE_URL}/api/v1/users/verify/${token.unHashedToken}`,
    ),
  });

  const createUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createUser) {
    throw new ApiError(
      "500",
      "Something went wrong while registering the user",
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(403, "Invalid Email or Password");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(403, "Invalid Email or Password");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please check your email and verify your email , then Re-Login here",
    );
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  const loggedUser = await User.findById(user._id).select(
    "email username fullname avatar",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User succesfully Logged Out"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Invalid token");
  }

  // Hash it again
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid token or Expiry token");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(200, "Email verified successfully"));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Email is not registered, please sign up.");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified, please log in.");
  }

  const token = user.generateTemporaryToken();

  user.emailVerificationToken = token.hashedToken;
  user.emailVerificationExpiry = token.tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email,
    subject: "Verify your Email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/users/verify/${token.unHashedToken}`,
    ),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Verification email sent. Please check your inbox."),
    );
});
const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hash it again
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired token");

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken ?? req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const accessToken = await user.generateAccessToken();
    const newrefreshToken = await user.generateRefreshToken();

    user.refreshToken = newrefreshToken;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const token = user.generatePasswordResetToken();
  user.forgotPasswordToken = token.hashedToken;
  user.forgotPasswordExpiry = token.expiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email,
    subject: "Reset Your Password",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/users/reset-password/${token.unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Reset Password email sent"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (newPassword !== confPassword) {
    throw new ApiError(400, "new password and confirm password doesn't match");
  }

  const user = await User.findById(req.user?.id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { username, fullname, email } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (username && username !== user.username) {
    const existing = await User.findOne({ username });
    if (existing) {
      throw new ApiError(409, "Username is already taken");
    }
    user.username = username;
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, "email is already taken");
    }
    user.email = email;
  }

  if (fullname) user.fullname = fullname;

  // Handle optional avatar update
  if (req.file?.path) {
    const avatar = await uploadOnCloudinary(req.file.path);
    if (!avatar) throw new ApiError(400, "Avatar upload failed");

    await deleteFromCloudinary(user.avatar.url);

    user.avatar = {
      localPath: req.file.path,
      url: avatar.url,
    };
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(userId).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
  updateProfile,
};
