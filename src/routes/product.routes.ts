import { Router } from 'express';
import productController from '../controllers/product.controller';
import authenticate from '../middlewares/authenticate';
import isAdmin from '../middlewares/isAdmin';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes - require authentication
router.post('/:id/review', authenticate, productController.addProductReview);
router.delete('/:productId/reviews/:reviewId', authenticate, productController.deleteProductReview);

// Admin routes - require admin privileges
router.post('/', authenticate, isAdmin, productController.createProduct);
router.put('/:id', authenticate, isAdmin, productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

export default router; 