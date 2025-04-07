import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT, mongo } from '../config/config';

class AuthController {
  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract all required fields
      const { name, surname, email, password, phone } = req.body;
      
      // Validate all required fields
      if (!name || !surname || !email || !password || !phone) {
        res.status(400).json({ message: 'Missing required fields (name, surname, email, password, phone)' });
        return;
      }
      
      // Check if user with email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'User with this email already exists' });
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(JWT.BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user, including surname and phone
      const newUser = new User({
        name,
        surname,
        email,
        phone,
        password: hashedPassword,
        isAdmin: false, // Regular users by default
        averageRating: 0 // Initialize average rating
      });
      
      const savedUser = await newUser.save();
      
      // Generate tokens
      const accessToken = this.generateAccessToken(savedUser._id as string);
      const refreshToken = this.generateRefreshToken(savedUser._id as string);
      
      // Set cookies
      this.setTokenCookies(res, accessToken, refreshToken);
      
      // Remove password from response
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  }

  /**
   * Login a user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user._id as string);
      const refreshToken = this.generateRefreshToken(user._id as string);
      
      // Set cookies
      this.setTokenCookies(res, accessToken, refreshToken);
      
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(200).json({
        message: 'Login successful',
        user: userResponse
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  }

  /**
   * Logout a user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error logging out' });
    }
  }

  /**
   * Check authentication status
   */
  checkAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      // User is already authenticated by the middleware
      const user = (req as any).user;
      
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(200).json({
        isAuthenticated: true,
        user: userResponse
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Error checking authentication status' });
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(userId: string) {
    return jwt.sign({ userId }, JWT.ACCESS_SECRET_KEY, {
      expiresIn: JWT.ACCESS_EXPIRES_IN
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string) {
    return jwt.sign({ userId }, JWT.REFRESH_SECRET_KEY, {
      expiresIn: JWT.REFRESH_EXPIRES_IN
    });
  }

  /**
   * Set token cookies in response
   */
  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    // Set access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
}

export default new AuthController(); 