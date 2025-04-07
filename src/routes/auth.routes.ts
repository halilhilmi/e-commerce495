import { Router, Request, Response } from "express";

import { MissingParameterError } from "../utils/errors";
import catchFunction from "../utils/catchFunction";
import sendResponse from "../utils/sendResponse";

import AuthService from "../services/auth.service";
import authenticate from "../middlewares/authenticate";
import authController from '../controllers/auth.controller';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check', authenticate, authController.checkAuth);

router.post(
    "/refresh-token",
    catchFunction(async (req: Request, res: Response) => {
        const refreshToken: string = req.cookies["refreshToken"];

        if (!refreshToken) {
            throw new MissingParameterError("refreshToken");
        }

        const token: string = await AuthService.refreshToken(refreshToken);

        return sendResponse(res, 200, {}, "Token refreshed successfully!", {
            accessToken: token,
        });
    })
);

export default router;
