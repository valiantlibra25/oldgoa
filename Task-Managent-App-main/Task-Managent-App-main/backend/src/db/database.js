import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected with Database ${connection.host}👽`);
  } catch (error) {
    console.error(`Error in connection with Database`, error);
    process.exit(1);
  }
};

export default connectDB;
