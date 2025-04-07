import { Request, Response, NextFunction } from "express";

import sendResponse from "../utils/sendResponse";
import { logError } from "../utils/logger";

const catchFunction = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: Error) => {
      logError(
        `Req url : ${req.originalUrl} method : ${req.method} -> On catch function : ${err.message}`
      );
      sendResponse(res, 400, {}, err.message);
    });
  };
};

export default catchFunction;
