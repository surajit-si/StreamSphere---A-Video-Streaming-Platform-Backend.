import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessAndRefreshTokens = async (user_id) => {
  try {
    const user = await User.findById(user_id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save to db with refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //validateBeforeSave: false is importent because is not it will check all required fields.

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating AccessAndRefreshTokens.",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user detels from frontend
  //validation
  //cheak if user already exists -username-email
  //file is or not avtar requred-
  //upload to cloudinary, cheak avtar is upload or not?
  //create user object -create entry in DB
  //remove password and refresh token field from response
  //responce or not? null?
  //return response

  const { fullName, email, username, password } = req.body;
  //-------------------------------Authentication---------------------------
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }
  //user already regigter or not
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], //$or,$and etc is a part of mongodb
  });

  if (existedUser) {
    throw new ApiError(409, "User already exist, please login.");
  }
  //cheak if avatar and coverImage is in server or not? req.files is from multer
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImg?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }
  //Upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImgLocalPath);

  //check if avatar is or not
  if (!avatar) {
    throw new ApiError(500, "Avatar not found");
  }
  //create user object and upload in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //check if user successfully created or not & removes the password and token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Registering user failed!");
  }
  //send response
  return res
    .status(201)
    .json(new ApiResponce(200, createdUser, "user registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  //GET data from req.body
  //username or password
  //find user
  //check password
  // password?access and refresh token
  //send tokens: coockies
  //response

  //Destructure
  let { username, email, password } = req.body;
  username = username?.toLowerCase();
  email = email?.toLowerCase();

  //check if fields are avilable.
  if (!(username || email)) {
    throw new ApiError(400, "Email or Password is required.");
  }

  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  //find user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not exist");
  }

  //check password [importent: "user" not "User"]
  const isValidPassword = await user.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new ApiError(401, "password incorrect");
  }

  //generate access & refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  //send coockies
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponce(
        200,
        {
          loggedinUser,
          accessToken,
          refreshToken,
        },
        "user successfully loggedin.",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //for the middleware that we created that varifies token
  await User.findByIdAndUpdate(
    req.user._id,
    {
      //mongoDB Method
      $set: {
        refreshToken: undefined,
      },
    },
    { returnDocument: "after" },
  );

  //send coockies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponce(200, {}, "user logged out successfully."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized user");
  }
  try {
    //my user's refresh token and db token is differant user"s is encrypted.
    const decoadedInfo = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decoadedInfo?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    //match if user's refresh token match the DB refresh token
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expaired or modified.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user?._id,
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new ApiResponce(200, {}, "Tokens successfully generated."));
  } catch (err) {
    throw new ApiError(401, err.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //get user input password
  //match if db encrypted password is matches the user input password
  //encrypt new password and push to db
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || !oldPassword) {
    throw new ApiError(400, "newPassword and oldPassword is required");
  }

  const user = await User.findById(req.user?._id);
  const checkPassword = await user.isPasswordCorrect(oldPassword);

  if (!checkPassword) {
    throw new ApiError(400, "wrong password");
  }

  user.password = newPassword; // bcrypt will automaticly hash the password with pre method in model.

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponce(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponce(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "email and fullName is requided");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { returnDocument: "after" },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponce(200, user, "account detiels updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "user not varified");
  }

  const avatarLocalPath = req.file?.path; //there "req.file" because here we need 1 file so we don't need to use multer.fields in router.

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not found");
  }

  const avatarURL = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarURL) {
    throw new ApiError(500, "avatar cloud upload failed");
  }

  const updatedUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        avatar: avatarURL.url,
      },
    },
    { returnDocument: "after" },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponce(200, updatedUser, "avatar updated successfully"));
});

const updateCover = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "user not varified");
  }

  const coverLocalPath = req.file?.path; //there "req.file" because here we need 1 file so we don't need to use multer.fields in router.

  if (!coverLocalPath) {
    throw new ApiError(400, "Cover file not found");
  }

  const coverURL = await uploadOnCloudinary(coverLocalPath);
  if (!coverURL) {
    throw new ApiError(500, "cover cloud upload failed");
  }

  const updatedUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        coverImage: coverURL.url,
      },
    },
    { returnDocument: "after" },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponce(200, updatedUser, "cover updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      //subscriber
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      //subscribed
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscribedChannelCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        subscribedChannelCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res.status(200).json(new ApiResponce(200, channel[0], "successful"));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              //If we create the project state without creating the pipeline, it will not work because the user is still inside the video correction, not in the user. So for inside the user, we need to create a pipeline.
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            //for only making Not to send array
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        user[0].watchHistory,
        "watchHistory fetched successfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCover,
  getUserChannelProfile,
  getUserWatchHistory,
};
