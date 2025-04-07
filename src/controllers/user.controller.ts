import { Request, Response } from 'express';
import User from '../models/user.model';
import Product from '../models/product.model';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { JWT } from '../config/config';

class UserController {
  /**
   * Get all users - Admin only
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-password');
      res.status(200).json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: 'Error getting users' });
    }
  }

  /**
   * Create a new user - Admin only
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, surname, email, password, isAdmin, phone } = req.body;
      
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
      
      // Create new user
      const newUser = new User({
        name,
        surname,
        email,
        phone,
        password: hashedPassword,
        isAdmin: isAdmin || false,
        averageRating: 0
      });
      
      const savedUser = await newUser.save();
      
      // Remove password from response
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  }

  /**
   * Delete a user - Admin only
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      const userIdObj = new mongoose.Types.ObjectId(id);
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      
      // Check if user exists
      const user = await User.findById(userIdObj).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Prevent deleting yourself
      const currentUserId = (req as any).user._id;
      if (currentUserId.toString() === id) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: 'You cannot delete your own account' });
        return;
      }

      // --- Remove user's reviews from all products ---
      // Find products reviewed by the user
      const productsToUpdate = await Product.find({ "reviews.userId": userIdObj }).session(session);

      for (const product of productsToUpdate) {
          // Filter out reviews by the deleted user
          product.reviews = product.reviews.filter(review => review.userId.toString() !== id);
          
          // Recalculate average rating for the product
          if (product.reviews.length > 0) {
              const sum = product.reviews.reduce((total, review) => total + review.rating, 0);
              product.avgRating = sum / product.reviews.length;
          } else {
              product.avgRating = 0; // Reset if no reviews left
          }
          await product.save({ session }); // Save within the transaction
          console.log(`Updated reviews and rating for product ${product._id}`);
      }
      // --- End removing reviews ---
      
      // Delete the user
      await User.findByIdAndDelete(userIdObj).session(session);
      
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({ message: 'User deleted successfully and their reviews removed' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  }

  /**
   * Get user profile - Authenticated user can only get their own profile
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ message: 'Error getting user profile' });
    }
  }

  /**
   * Update user profile - Authenticated user can only update their own profile
   */
  async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const { name, surname, email, password } = req.body;
      
      // Build update object
      const updates: any = {};
      if (name) updates.name = name;
      if (surname) updates.surname = surname;
      if (email) updates.email = email;
      
      // If password is provided, hash it
      if (password) {
        const salt = await bcrypt.genSalt(JWT.BCRYPT_ROUNDS);
        updates.password = await bcrypt.hash(password, salt);
      }
      
      // Check if email already exists for another user
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          res.status(400).json({ message: 'Email already in use by another user' });
          return;
        }
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      ).select('-password');
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating user profile' });
    }
  }

  /**
   * Get user's reviews - Authenticated user can only get their own reviews
   */
  async getUserReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      
      // Find all products where the user has left a review
      const products = await Product.find({
        'reviews.userId': userId
      }).select('name reviews');
      
      // Extract all reviews by the user from the products
      interface UserReview {
        productId: string;
        productName: string;
        rating: number;
        comment?: string;
        createdAt: Date;
      }
      
      const userReviews: UserReview[] = [];
      
      for (const product of products) {
        const productReviews = product.reviews.filter(
          review => review.userId.toString() === userId.toString()
        );
        
        productReviews.forEach(review => {
          userReviews.push({
            productId: product._id.toString(),
            productName: product.name,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
          });
        });
      }
      
      // Sort reviews by date (newest first)
      userReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.status(200).json(userReviews);
    } catch (error) {
      console.error('Error getting user reviews:', error);
      res.status(500).json({ message: 'Error getting user reviews' });
    }
  }

  /**
   * Get PUBLIC user profile by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const user = await User.findById(id).select('name surname averageRating createdAt'); // Only select public fields

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({ message: 'Error getting user by ID' });
    }
  }

  /**
   * Get reviews written BY a specific user ID
   */
  async getReviewsByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }
      const userIdObj = new mongoose.Types.ObjectId(id);

      // Use aggregation pipeline to find reviews and include product name
      const reviews = await Product.aggregate([
        { $match: { 'reviews.userId': userIdObj } }, // Find products reviewed by user
        { $unwind: '$reviews' },                   // Flatten the reviews array
        { $match: { 'reviews.userId': userIdObj } }, // Filter for the specific user's reviews
        {
          $project: {                              // Select and reshape fields
            _id: '$reviews._id',
            rating: '$reviews.rating',
            comment: '$reviews.comment',
            createdAt: '$reviews.createdAt',
            productId: '$_id',                  // Add productId
            productName: '$name'                 // Add productName
          }
        },
        { $sort: { 'createdAt': -1 } }             // Sort reviews by date
      ]);

      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error getting reviews by user ID:', error);
      res.status(500).json({ message: 'Error getting reviews by user ID' });
    }
  }
}

export default new UserController(); 