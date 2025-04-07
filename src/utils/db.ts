import { logError, logInfo } from "./logger";
import { mongo } from "../config/config";

import mongoose from "mongoose";

// allow empty strings
mongoose.Schema.Types.String.checkRequired((v) => typeof v === "string");

// the below code fragment can be found in:
const connectDatabase = async (): Promise<boolean> => {
    try {
        logInfo("Connecting to database...");
        await mongoose.connect(mongo.DATABASE_CONNECTION_STRING);
        return true;
    } catch (error) {
        logError(`Database connection failed: ${error}`);
        return false;
    }
};

export default connectDatabase;


