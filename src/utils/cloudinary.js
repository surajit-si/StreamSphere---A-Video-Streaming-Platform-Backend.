import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadOnCloudinary(filepath) {
  try {
    if (!filepath) return null;
    //upload the file
    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });
    //file upload successful
    await fs.unlink(filepath);
    return response;
  } catch (err) {
    await fs.unlink(filepath);
    //removes temp locally file if operation failed!
  }
}

export { uploadOnCloudinary };
