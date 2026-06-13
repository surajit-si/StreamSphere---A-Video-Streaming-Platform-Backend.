import "dotenv/config";
import connectDB from "./db/index.js";
//local
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 4545, () => {
      console.log(
        `Server Started at: http://localhost:${process.env.PORT || 4545}/`,
      );
      app.on("error", (err) => {
        throw new Error(err);
      });
    });
  })
  .catch((err) => {
    console.log(`mongoDB Connection Failed!!`);
  });
