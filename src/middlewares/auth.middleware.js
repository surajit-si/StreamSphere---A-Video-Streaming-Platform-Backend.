import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

//middleware
export const varifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // || is for mobile devs

    if (!token) {
      throw new ApiError(401, "unautherized request.");
    }
    //varify token
    const decoadedInfo = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );
    const user = await User.findById(decoadedInfo?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "invalid accessToken");
    }
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "invalid Access Token.");
  }
});
