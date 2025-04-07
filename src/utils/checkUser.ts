import jwt from 'jsonwebtoken';
import { IUser, IResUser } from '../interfaces/user.interface';
import User from '../models/user.model';
import { ACCESS_SECRET_KEY } from '../config/config';
import _ from "lodash";

// Define keys explicitly belonging to IResUser
const IResUserKeys: (keyof IResUser)[] = [
    "_id",
    "name",
    "surname",
    "email",
    "phone",
    "addresses",
    "cart",
    "wishlist",
    // "orderHistory",
    "isAdmin",
    "createdAt",
    "updatedAt",
];

// check user type before sending response
export function checkUserWithJwt(user: IUser): IResUser {
    // Ensure user object is plain JS object if it's a Mongoose doc
    const userObject = typeof user.toObject === 'function' ? user.toObject() : user;
    
    // Pick only the allowed keys defined in IResUserKeys
    const resUser: IResUser = _.pick(userObject, IResUserKeys) as IResUser;

    return resUser;
}