import dotenv from "dotenv";
import buildConnectionURI from "../utils/buildConnectionURI";

dotenv.config(); 

// Database configuration
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME!;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD!;
export const DATABASE_HOST = process.env.DATABASE_HOST!;
export const DATABASE_PORT = process.env.DATABASE_PORT
    ? Number(process.env.DATABASE_PORT)
    : 27017;
export const DATABASE_NAME = process.env.DATABASE_NAME!;
export const DATABASE_PROTOCOL = process.env.DATABASE_PROTOCOL!;
export const DATABASE_OPTIONS = process.env.DATABASE_OPTIONS
    ? JSON.parse(process.env.DATABASE_OPTIONS)
    : {};

// Server configuration
export const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || "localhost";
export const SERVER_PORT = process.env.PORT
    ? Number(process.env.PORT)
    : process.env.SERVER_PORT
    ? Number(process.env.SERVER_PORT)
    : 8000;

// JWT configuration
export const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY!;
export const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "15m";
export const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY!;
export const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d"; 
export const BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS
    ? Number(process.env.BCRYPT_ROUNDS)
    : 10;

export const TOTP_SECRET_KEY = process.env.TOTP_SECRET_KEY!;

// Feature flags
export const ENABLE_GUEST_CHECKOUT = process.env.ENABLE_GUEST_CHECKOUT === 'true';
export const ENABLE_INVENTORY_MANAGEMENT = process.env.ENABLE_INVENTORY_MANAGEMENT === 'true' || true;
export const ENABLE_REVIEWS = process.env.ENABLE_REVIEWS === 'true' || true;

export const mongo = {
    DATABASE_USERNAME,
    DATABASE_PASSWORD,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_CONNECTION_STRING: buildConnectionURI({
        protocol: DATABASE_PROTOCOL,
        host: DATABASE_HOST,
        port: DATABASE_PORT,
        user: DATABASE_USERNAME,
        pass: DATABASE_PASSWORD,
        name: DATABASE_NAME,
        options: DATABASE_OPTIONS,
    }),
};

export const server = {
    HOSTNAME: SERVER_HOSTNAME,
    PORT: SERVER_PORT,
};

export const JWT = {
    ACCESS_SECRET_KEY,
    ACCESS_EXPIRES_IN,
    REFRESH_SECRET_KEY,
    REFRESH_EXPIRES_IN,
    BCRYPT_ROUNDS,
};

export const features = {
    ENABLE_GUEST_CHECKOUT,
    ENABLE_INVENTORY_MANAGEMENT,
    ENABLE_REVIEWS
};

