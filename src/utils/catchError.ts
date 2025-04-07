import { logCatch } from "../utils/logger";

const catchError = (error: any): null => {
  const errorMessage =
    error.response?.data?.error_message || error.message || error;
  logCatch(errorMessage);
  return null;
};

export default catchError;
