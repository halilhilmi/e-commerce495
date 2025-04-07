import { Request, Response } from 'express';
import Product from '../models/product.model';
import { IProduct } from '../interfaces/product.interface';
import mongoose, { Types } from 'mongoose';

class ProductController {
  /**
   * Get all products
   */
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      let query: any = { isActive: true };
      
      if (category && category !== 'All') {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      const products = await Product.find(query);
      res.status(200).json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ message: 'Error getting products' });
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID' });
        return;
      }
      
      const product = await Product.findById(id).populate('reviews.userId', 'name');
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      res.status(200).json(product);
    } catch (error) {
      console.error('Error getting product:', error);
      res.status(500).json({ message: 'Error getting product' });
    }
  }

  /**
   * Create a new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, price, category, images, inventory } = req.body;
      
      if (!name || !price || !category) {
        res.status(400).json({ message: 'Name, price, and category are required fields' });
        return;
      }
      
      const productData: Partial<IProduct> = {
        name,
        description,
        price,
        category,
        images: images || [],
        inventory: inventory || [],
        reviews: [],
        avgRating: 0
      };
      
      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();
      
      res.status(201).json(savedProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Server error creating product' });
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID' });
        return;
      }
      
      const product = await Product.findById(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
      
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Server error updating product' });
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID' });
        return;
      }
      
      const product = await Product.findById(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      await Product.findByIdAndDelete(id);
      
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Server error deleting product' });
    }
  }

  /**
   * Rate a product
   */
  async rateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = (req as any).user._id;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID' });
        return;
      }
      
      if (!rating || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 10) {
        res.status(400).json({ message: 'Rating must be a number between 1 and 10' });
        return;
      }
      
      const product = await Product.findById(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      // Check if user has already rated this product
      const existingRatingIndex = product.reviews.findIndex(
        review => review.userId.toString() === userId.toString() && !review.comment
      );
      
      if (existingRatingIndex !== -1) {
        // Update existing rating
        product.reviews[existingRatingIndex].rating = Number(rating);
      } else {
        // Add new rating
        product.reviews.push({
          _id: new Types.ObjectId(),
          userId,
          rating: Number(rating),
          comment: "",
          createdAt: new Date()
        });
      }
      
      // Calculate new average rating
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.avgRating = totalRating / product.reviews.length;
      
      await product.save();
      
      res.status(200).json({ message: 'Product rated successfully', avgRating: product.avgRating });
    } catch (error) {
      console.error('Error rating product:', error);
      res.status(500).json({ message: 'Error rating product' });
    }
  }

  /**
   * Review a product
   */
  async reviewProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comment, rating } = req.body;
      const userId = (req as any).user._id;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid product ID' });
        return;
      }
      
      if (!comment) {
        res.status(400).json({ message: 'Comment is required' });
        return;
      }
      
      const product = await Product.findById(id);
      
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      
      // Check if user has already reviewed this product
      const existingReviewIndex = product.reviews.findIndex(
        review => review.userId.toString() === userId.toString() && review.comment
      );
      
      if (existingReviewIndex !== -1) {
        // Update existing review
        product.reviews[existingReviewIndex].comment = comment;
        if (rating) {
          product.reviews[existingReviewIndex].rating = Number(rating);
        }
      } else {
        // Add new review
        const actualRating = rating || 5; // Default rating is 5 if not provided
        product.reviews.push({
          _id: new Types.ObjectId(),
          userId,
          rating: Number(actualRating),
          comment,
          createdAt: new Date()
        });
      }
      
      // Calculate new average rating
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.avgRating = totalRating / product.reviews.length;
      
      await product.save();
      
      res.status(200).json({ message: 'Product reviewed successfully' });
    } catch (error) {
      console.error('Error reviewing product:', error);
      res.status(500).json({ message: 'Error reviewing product' });
    }
  }
}

export default new ProductController(); 