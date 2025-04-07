import { Response, NextFunction, Request } from "express";
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { ACCESS_SECRET_KEY } from '../config/config';
import catchFunction from "../utils/catchFunction";
import { IUser } from "../interfaces/user.interface";

interface IAuthenticatedRequest extends Request {
    user?: IUser; 
}

const isAuthenticated = catchFunction(
    async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
        const token = req.cookies["ads-access-token"]?.replace("Bearer ", "") || req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "Authentication token missing." });
        }

        try {
            const decoded: any = jwt.verify(token, ACCESS_SECRET_KEY);
            if (!decoded || !decoded._id) {
                 return res.status(401).json({ message: "Invalid token payload." });
            }
            const user = await User.findById(decoded._id);

            if (!user) {
                return res.status(401).json({ message: "User not found or token invalid." });
            }

            req.user = user;

            console.log("User authenticated successfully");
            return next();
        } catch (error) {
             console.error("Authentication error:", error);
             if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ message: "Token expired." });
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ message: "Invalid token." });
            }
            return res.status(500).json({ message: "Internal server error during authentication." });
        }
    }
);

export default isAuthenticated;
