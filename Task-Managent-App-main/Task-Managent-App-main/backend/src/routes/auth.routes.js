import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  updateProfile,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidator,
  userRegistrationValidator,
} from "../validators/index.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(
    upload.single("avatar"),
    userRegistrationValidator(),
    validate,
    registerUser,
  );
router.route("/verify/:token").get(verifyEmail);
router.route("/resend-verify").post(resendEmailVerification);
router.route("/forget-password").post(forgotPasswordRequest);
router.route("/reset-password/:token").post(resetForgottenPassword);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/getme").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router
  .route("/update-profile")
  .patch(verifyJWT, upload.single("avatar"), updateProfile);

export default router;
