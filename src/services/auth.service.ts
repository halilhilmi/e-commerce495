import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import jwt from "jsonwebtoken";

// models
// import Admin from "../models/admin.model"; // Removed

// import { IAdmin } from "../interfaces/admin.interface"; // Removed

import {
    checkPassword,
    generateOtp,
    encryptPassword,
    validatePassword,
} from "../utils";

import { JWT } from "../config/config";


export default class AuthService {
    static async signUp({
        password,
        email,
        name,
        surname,
        isAdmin,
        organizationId,
        ...data
    }: {
        password: string;
        email: string;
        name: string;
        surname: string;
        isAdmin: boolean
        organizationId: string;
        [key: string]: any;
    }): Promise<IUser> {
        const user: IUser = new User({ email, name, surname, isAdmin, password, ...data });

        if (!validatePassword(password)) {
            throw new Error(
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            );
        }
        
        user.password = await encryptPassword(password);

        await user.save();
        
        return user;
    }

    static async loginDirect(user: any): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        user: any;
    }> {
        const [accessToken, refreshToken] = await Promise.all([
            jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, JWT.ACCESS_SECRET_KEY, {
                expiresIn: JWT.ACCESS_EXPIRES_IN,
            }),
            jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, JWT.REFRESH_SECRET_KEY, {
                expiresIn: JWT.REFRESH_EXPIRES_IN,
            })
        ]);

        const tokens: { accessToken: string; refreshToken: string } = {
            accessToken,
            refreshToken,
        };

        return { tokens, user };
    }


    static async login({
        phone,
        password,
    }: {
        phone: string;
        password: string;
    }): Promise<any> {
        let user: IUser | null = null;
        if (phone) {
            user = await User.findOne({ phone }).lean() as IUser;
        }

        if (!user) {
            throw new Error("User with this phone number not found");
        }

        if (phone == null || password == null) {
            throw new Error("Invalid credentials");
        }


        const validPassword = await checkPassword(password, user.password);

        if (!validPassword) {
            throw new Error("Invalid password");
        }

        return AuthService.loginDirect({ ...user });
    }

    static async refreshToken(refreshToken: string): Promise<string> {
        const decoded: any = jwt.verify(refreshToken, JWT.REFRESH_SECRET_KEY);

        if (!decoded || !decoded._id) {
            throw new Error("Invalid refresh token");
        }

        const user: IUser = await User.findById(decoded._id);

        if (!user) {
            throw new Error("User not found during token refresh");
        }

        const accessToken: string = jwt.sign(
            { _id: decoded._id, isAdmin: user.isAdmin },
            JWT.ACCESS_SECRET_KEY,
            {
                expiresIn: JWT.ACCESS_EXPIRES_IN,
            }
        );

        await user.save();

        return accessToken;
    }

}
