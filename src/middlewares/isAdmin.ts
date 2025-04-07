import { Request, Response, NextFunction } from 'express';

const isAdmin = (req: Request, res: Response, next: NextFunction): Promise<void> | void => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (!user.isAdmin) {
      res.status(403).json({ message: 'Admin privileges required' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Admin check error' });
  }
};

export default isAdmin; 