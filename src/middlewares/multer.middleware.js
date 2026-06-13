/* import multer from "multer";
import rootdir from "../utils/rootDir.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, rootdir("public", "temp"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
 */

import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
