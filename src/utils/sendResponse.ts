import { Response } from "express";
const sendResponse = (
  res: Response,
  code: number,
  data: unknown,
  message: string,
  tokens?: { accessToken: string; refreshToken?: string }
): Response => {
  // send refresh token through cookie
  if (tokens) {
    tokens.refreshToken &&
      res.cookie("ads-refresh-token", tokens.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 604800000, // 7 days
      });
    if (tokens.accessToken) {
      res.header("ads-access-token", tokens.accessToken);
      res.cookie("ads-access-token", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 604800000, // 7 days
      });
    }
    // tokens.accessToken &&
    //   res.header("ads-access-token", tokens.accessToken);
  }

  return res.status(code).json({
    status: code >= 200 && code < 300 ? "success" : "error",
    data: data,
    message:
      message.length === 0
        ? code >= 200 && code < 300
          ? "success"
          : "something_went_wrong"
        : message,
  });
};

export default sendResponse;
