import { Document, Types } from "mongoose";

interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

interface CartItem {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
}

interface IUser extends Document {
    name: string;
    surname: string;
    email: string;
    phone: string;
    password: string | null;
    addresses: Address[];
    cart: CartItem[];
    wishlist: Types.ObjectId[];
    orderHistory: Types.ObjectId[];
    firebaseToken: string;
    isAdmin: boolean;
    averageRating?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IResUser extends Document {
    name: string;
    surname: string;
    email: string;
    phone: string;
    addresses: Address[];
    cart: CartItem[];
    wishlist: Types.ObjectId[];
    orderHistory: Types.ObjectId[];
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export { IUser, IResUser, Address, CartItem };
