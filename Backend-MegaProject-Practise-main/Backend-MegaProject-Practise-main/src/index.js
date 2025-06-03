import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3000;
process.setMaxListeners(15);
//cpnnecting to DB
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`server is running on port: ${PORT}`));
  })
  .catch((err) => {
    console.error("Mongodb connection error", err);
    process.exit(1);
  });
