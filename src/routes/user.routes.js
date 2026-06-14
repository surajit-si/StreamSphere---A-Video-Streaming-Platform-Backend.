import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  getCurrentUser,
  updateAvatar,
  updateCover,
  getUserChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImg",
      maxCount: 1,
    },
  ]),
  registerUser,
);
router.route("/login").post(upload.none(), loginUser);

//secured Routes
router.route("/logout").post(varifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/change-password")
  .post(varifyJWT, upload.none(), changeCurrentPassword);

router.route("/update-profile").patch(varifyJWT,upload.none(), updateAccountDetails);

router.route("/get-user").get(varifyJWT, getCurrentUser);

router
  .route("/update-avatar")
  .patch(varifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover")
  .patch(varifyJWT, upload.single("cover"), updateCover);

router.route("/channel/:username").get(varifyJWT, getUserChannelProfile);

router.route("/history").get(varifyJWT, getUserWatchHistory);

export default router;
