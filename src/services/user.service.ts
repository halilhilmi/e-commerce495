import User from "../models/user.model";
import { IUser, IResUser } from "../interfaces/user.interface";
import jwt from 'jsonwebtoken';
import { ACCESS_SECRET_KEY } from "../config/config";
import { FilterQuery } from "mongoose";

interface FindUsersParams {
    email?: string;
    name?: string;
    nickname?: string;
    page?: number;
    limit?: number;
    isAdmin?: boolean;
}

export default class UserService {
    static async update(
        currentUser: IUser,
        {
            name,
            surname,
            email,
        }: {
            name?: string;
            surname?: string;
            email?: string;
        }
    ): Promise<IUser> {
        const updateData: Partial<IUser> = {
            ...(name && { name }),
            ...(surname && { surname }),
            ...(email && { email }),
        };

        const updateQuery: {
            $set: Partial<IUser>;
            $addToSet?: { nicknames: { $each: string[] } };
        } = { $set: updateData };

        const updatedUser = await User.findOneAndUpdate(
            { _id: currentUser._id },
            updateQuery,
            {
                new: true,
            }
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    static async deleteUser(token: string): Promise<IUser> {
        try {
            const decoded = jwt.verify(
                token,
                ACCESS_SECRET_KEY as string
            ) as {
                _id: string,
                isAdmin: boolean
            };
            const user = await User.findByIdAndDelete(decoded._id);
            if (!user) {
                throw new Error('This use does not exist!')
            }
            return user;
        }
        catch {
            throw new Error("User cannot be deleted!")
        }
    }

    static async deleteUserById(userId: string): Promise<IUser> {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('This user does not exist!')
        }
        return user;
    }

    static async updateUserById(userId: string, updateData: Partial<IUser>): Promise<IUser> {
        const sanitizedUpdateData = { ...updateData };
        delete sanitizedUpdateData._id;
        delete sanitizedUpdateData.password;
        delete sanitizedUpdateData.createdAt;
        delete sanitizedUpdateData.updatedAt;

        if (sanitizedUpdateData.email) {
            const existingUser = await User.findOne({ 
                email: sanitizedUpdateData.email,
                _id: { $ne: userId }
            });
            if (existingUser) {
                throw new Error('This email is already in use!');
            }
        }

        if (sanitizedUpdateData.phone) {
            const existingUser = await User.findOne({ 
                phone: sanitizedUpdateData.phone,
                _id: { $ne: userId }
            });
            if (existingUser) {
                throw new Error('This phone number is already in use!');
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: sanitizedUpdateData },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    static async listUsers({
        email,
        name,
        nickname,
        page = 1,
        limit = 10,
        isAdmin,
    }: FindUsersParams): Promise<{ users: IResUser[], total: number, page: number, limit: number }> {
        const query: FilterQuery<IUser> = {};

        if (email) query.email = { $regex: email, $options: "i" };
        if (name) query.name = { $regex: name, $options: "i" };
        if (nickname) query.nickname = { $regex: nickname, $options: "i" };
        if (isAdmin !== undefined) query.isAdmin = isAdmin;

        const skip = (page - 1) * limit;

        try {
            const total = await User.countDocuments(query);
            // Explicitly select fields to match IResUser (excluding password)
            const users = await User.find(query)
                .select('-password') // Exclude password
                .skip(skip)
                .limit(limit)
                .lean(); // Use lean() for better performance and plain objects

            // Cast to IResUser[] although lean() should return plain objects
            return { users: users as IResUser[], total, page, limit };
        } catch (error) {
            console.error("Error listing users:", error);
            throw new Error("Failed to retrieve users");
        }
    }
}
