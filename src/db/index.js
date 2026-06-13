import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB() {
  try {
    const connectionInstence = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(`mongoDB connected! DB: ${connectionInstence.connection.host}`);
  } catch (err) {
    console.log("\n \n \n MONGODB connection Error: ", err);
    process.exit(1);
  }
}

export default connectDB;
