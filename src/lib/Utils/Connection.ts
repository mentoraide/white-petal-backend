import mongoose from "mongoose"
import dotenv from "dotenv";
dotenv.config()

export const connectDB = (): void => {
	const mongoURI: string = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/mydatabase"
	
	mongoose.connect(mongoURI)
		.then(() => {
			console.log("MongoDB connected")
		})
		.catch((error) => {
			console.error("MongoDB connection error:", error)
		})
}

