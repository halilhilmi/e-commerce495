import { Request, Response } from 'express';
import Product from '../models/product.model';
import User from '../models/user.model';
import catchFunction from '../utils/catchFunction';
import mongoose from 'mongoose';

// Get all products with pagination, filtering, and search
const getAllProducts = catchFunction(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Add filters from query params
  const query: any = { isActive: true };
  const { category, search } = req.query;

  // Handle category filtering (can be single or multiple)
  if (category && category !== 'All') {
    if (Array.isArray(category)) {
      query.category = { $in: category };
    } else {
      query.category = category;
    }
  }

  // Handle text search across multiple fields
  if (search) {
    const searchRegex = new RegExp(search as string, 'i'); // Case-insensitive regex
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex }, // Also search category name
      { tags: { $in: [searchRegex] } } // Search in tags array
    ];
  }
  
  const products = await Product.find(query)
    .populate({
        path: 'reviews.userId',
        select: 'name surname'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Product.countDocuments(query); // Count documents matching the query
  
  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get featured products
const getFeaturedProducts = catchFunction(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await Product.find({ isActive: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    data: products
  });
});

// Get products by category
const getProductsByCategory = catchFunction(async (req: Request, res: Response) => {
  const { category } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const products = await Product.find({ isActive: true, category })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Product.countDocuments({ isActive: true, category });
  
  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

// Search products
const searchProducts = catchFunction(async (req: Request, res: Response) => {
  const { q, category } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const query: any = { isActive: true };
  
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q as string, 'i')] } }
    ];
  }
  
  if (category) {
    query.category = category;
  }
  
  const products = await Product.find(query)
    .populate({
        path: 'reviews.userId',
        select: 'name surname'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get product by ID
const getProductById = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const product = await Product.findOne({ _id: id, isActive: true })
      .populate({
          path: 'reviews.userId',
          select: 'name surname'
      });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Create a new product
const createProduct = catchFunction(async (req: Request, res: Response) => {
  const { name, description, price, category, images, inventory } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required fields'
    });
  }
  
  const newProduct = new Product({
    name,
    description,
    price,
    category,
    images: images || [],
    inventory: inventory || [],
    reviews: [],
    avgRating: 0
  });
  
  const savedProduct = await newProduct.save();
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: savedProduct
  });
});

// Update a product
const updateProduct = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!updatedProduct) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// Delete a product (mark as inactive)
const deleteProduct = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // --- Get IDs of users who reviewed this product BEFORE deletion ---
  const userIdsToUpdate = product.reviews
      .map(review => review.userId)
      .filter((value, index, self) => 
          self.findIndex(id => id.toString() === value.toString()) === index
      ); // Get unique user IDs

  // --- Delete the product --- 
  await Product.findByIdAndDelete(id);

  // --- Update average rating for affected users --- 
  if (userIdsToUpdate.length > 0) {
      console.log(`Recalculating average ratings for ${userIdsToUpdate.length} users.`);
      try {
          for (const userId of userIdsToUpdate) {
              const userIdObj = new mongoose.Types.ObjectId(userId); // Ensure ObjectId
              // Find all REMAINING reviews by this user
              const userReviews = await Product.aggregate([
                  { $unwind: "$reviews" },
                  { $match: { "reviews.userId": userIdObj } },
                  { $group: { _id: "$reviews.userId", avgRating: { $avg: "$reviews.rating" } } }
              ]);

              let userAvgRating = 0;
              if (userReviews.length > 0) {
                  userAvgRating = userReviews[0].avgRating;
              }

              // Update the user document
              await User.findByIdAndUpdate(userId, { averageRating: userAvgRating });
              console.log(`Updated average rating for user ${userId} to ${userAvgRating}`);
          }
      } catch (error) {
          console.error("Error updating user average ratings after product deletion:", error);
          // Log error but allow the deletion response to proceed
      }
  }
  // --- End Update User Average Rating ---

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Update product inventory
const updateInventory = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { inventory } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  if (!inventory || !Array.isArray(inventory)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide inventory data'
    });
  }
  
  const product = await Product.findByIdAndUpdate(id, { inventory }, {
    new: true,
    runValidators: true
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Upload product image
const uploadProductImage = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please provide image URL'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  product.images.push(imageUrl);
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Delete product image
const deleteProductImage = catchFunction(async (req: Request, res: Response) => {
  const { id, imageIndex } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const idx = parseInt(imageIndex);
  
  if (isNaN(idx)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image index'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  if (idx < 0 || idx >= product.images.length) {
    return res.status(400).json({
      success: false,
      message: 'Image index out of range'
    });
  }
  
  product.images.splice(idx, 1);
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Toggle featured status
const toggleFeatureProduct = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  product.featured = !product.featured;
  await product.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Get product reviews
const getProductReviews = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  const product = await Product.findById(id).populate({
    path: 'reviews.userId',
    select: 'name surname'
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: product.reviews
  });
});

// Add product review
const addProductReview = catchFunction(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = (req as any).user._id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }
  
  // Use Number() to handle potential string input from form
  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 10) { // Updated validation to 1-10
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid rating (1-10)'
    });
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Check if user already reviewed
  const existingReviewIndex = product.reviews.findIndex(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReviewIndex > -1) {
    // Update existing review
    product.reviews[existingReviewIndex].rating = numRating;
    product.reviews[existingReviewIndex].comment = comment || product.reviews[existingReviewIndex].comment; // Keep old comment if new one not provided
    product.reviews[existingReviewIndex].createdAt = new Date(); // Update timestamp
  } else {
    // Add new review
    const review = {
      userId,
      rating: numRating,
      comment,
      createdAt: new Date()
    };
    product.reviews.push(review as any);
  }
  
  // Calculate product average rating
  const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
  product.avgRating = totalRating / product.reviews.length;
  
  await product.save();

  // --- Update User Average Rating --- 
  try {
    // Find all reviews by this user across all products
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const userReviews = await Product.aggregate([
      { $unwind: "$reviews" },
      { $match: { "reviews.userId": userIdObj } },
      { $group: { _id: "$reviews.userId", avgRating: { $avg: "$reviews.rating" } } }
    ]);

    let userAvgRating = 0;
    if (userReviews.length > 0) {
      userAvgRating = userReviews[0].avgRating;
    }

    // Update the user document
    await User.findByIdAndUpdate(userId, { averageRating: userAvgRating });

  } catch (error) {
    console.error("Error updating user average rating:", error);
  }
  // --- End Update User Average Rating ---

  // --- Re-fetch the product with populated reviews to ensure response data is correct ---
  const updatedProductWithPopulatedReviews = await Product.findById(id).populate({
      path: 'reviews.userId',
      select: 'name surname'
  });
  // --- End Re-fetch ---

  res.status(201).json({
    success: true,
    data: updatedProductWithPopulatedReviews // Send the re-fetched and populated product
  });
});

// Delete a specific product review
const deleteProductReview = catchFunction(async (req: Request, res: Response) => {
  const { productId, reviewId } = req.params;
  const userId = (req as any).user._id; // Logged-in user ID

  // Validate IDs
  if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ success: false, message: 'Invalid Product or Review ID' });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Find the index of the review to remove
  const reviewIndex = product.reviews.findIndex(review => review._id.toString() === reviewId);

  if (reviewIndex === -1) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const reviewToDelete = product.reviews[reviewIndex];

  // Check ownership: Ensure the logged-in user is the author of the review
  if (reviewToDelete.userId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: 'You are not authorized to delete this review' });
  }

  // Remove the review from the array
  product.reviews.splice(reviewIndex, 1);

  // Recalculate average rating for the product
  if (product.reviews.length > 0) {
    const totalRating = product.reviews.reduce((sum, item) => sum + item.rating, 0);
    product.avgRating = totalRating / product.reviews.length;
  } else {
    product.avgRating = 0; // Reset if no reviews left
  }

  // Save the updated product
  await product.save();

  // --- Update User Average Rating (Similar to addProductReview) ---
  try {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const userReviews = await Product.aggregate([
      { $unwind: "$reviews" },
      { $match: { "reviews.userId": userIdObj } },
      { $group: { _id: "$reviews.userId", avgRating: { $avg: "$reviews.rating" } } }
    ]);
    let userAvgRating = 0;
    if (userReviews.length > 0) {
      userAvgRating = userReviews[0].avgRating;
    }
    await User.findByIdAndUpdate(userId, { averageRating: userAvgRating });
  } catch (error) {
    console.error("Error updating user average rating after review deletion:", error);
  }
  // --- End Update User Average Rating ---

  res.status(200).json({ 
    success: true, 
    message: 'Review deleted successfully', 
    // Optionally send back the updated product or just the new avgRating
    avgRating: product.avgRating 
  });
});

export default {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  uploadProductImage,
  deleteProductImage,
  toggleFeatureProduct,
  getProductReviews,
  addProductReview,
  deleteProductReview
}; 