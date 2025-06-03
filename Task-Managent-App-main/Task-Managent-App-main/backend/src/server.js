import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/database.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8080;

//database connection
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port :${PORT}🚀`);
    });
  })
  .catch((error) => {
    console.log(`Error with Database connection`, error);
  });
