import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel, { IUser } from "../../models/user";
import { ResponseCode } from "../Utils/ResponseCode";
import { ParsedQs } from "qs";

// Extend Request object to include user data
export interface AuthRequest extends Request<any, any, any, ParsedQs> {
  file?: any;
  user?: IUser;
}

// Verify JWT and set `req.user` using Promises
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		res.status(ResponseCode.UNAUTHORIZED).json({ message: "No token provided" });
		return;
	}

	jwt.verify(token, process.env.JWT_SECRET ?? "", (err, decoded) => {
		if (err || !decoded || typeof decoded !== "object" || !("id" in decoded)) {
			res.status(ResponseCode.UNAUTHORIZED).json({ message: "Invalid token" });
			return;
		}

		UserModel.findById(decoded.id)
			.then((user) => {
				if (!user) {
					res.status(ResponseCode.UNAUTHORIZED).json({ message: "User not found" });
					return;
				}
				req.user = user;
				next();
			})
			.catch(() => res.status(ResponseCode.SERVER_ERROR).json({ message: "Server error" }));
	});
};

// Role-based access control middleware using Promises
export const authorizeRoles = (...roles: string[]) => {
	return (req: AuthRequest, res: Response, next: NextFunction): void => {
		if (!req.user || !roles.includes(req.user.role)) {
			res.status(ResponseCode.FORBIDDEN).json({ status: false, message: "Access denied" });
			return;
		}
		next();
	};
};
