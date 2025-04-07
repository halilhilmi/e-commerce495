import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT } from '../config/config';
import User from '../models/user.model';

import { IUser } from '../interfaces/user.interface';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

interface IDecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate users based on JWT token
 */
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // from cookie or authorization header
    const accessToken = req.cookies.accessToken || 
      (req.headers.authorization?.startsWith('Bearer') ? 
        req.headers.authorization.split(' ')[1] : null);
    
    if (!accessToken) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    const decoded = jwt.verify(accessToken, JWT.ACCESS_SECRET_KEY) as IDecodedToken;
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
  
    (req as any).user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

export default authenticate;