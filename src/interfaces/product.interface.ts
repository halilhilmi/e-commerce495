import { Document, Types } from 'mongoose';

interface ProductReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface ProductVariant {
  name: string;
  options: string[];
}

interface ProductInventory {
  sku: string;
  quantity: number;
  variantOptions?: Record<string, string>;
  price?: number;
}

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  seller?: string;
  category: string;
  subcategory?: string;
  images: string[];
  batteryLife?: number;
  age?: number;
  size?: string;
  material?: string;
  variants?: ProductVariant[];
  inventory: ProductInventory[];
  reviews: ProductReview[];
  avgRating: number;
  numberOfReviewers?: number;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export { IProduct, ProductReview, ProductVariant, ProductInventory }; 