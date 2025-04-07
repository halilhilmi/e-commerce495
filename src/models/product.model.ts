import { model, Schema } from 'mongoose';
import { IProduct } from '../interfaces/product.interface';

const ProductReviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  comment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  seller: {
    type: String,
    required: false
  },
  images: [{
    type: String
  }],
  batteryLife: {
    type: Number,
    required: false
  },
  age: {
    type: Number,
    required: false
  },
  size: {
    type: String,
    required: false
  },
  material: {
    type: String,
    required: false
  },
  reviews: [ProductReviewSchema],
  avgRating: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

// (pre-save hook)
ProductSchema.pre<IProduct>('save', function(next) {
  if (this.isModified('reviews') && this.reviews) { 
    if (this.reviews.length > 0) {
      const sum = this.reviews.reduce((total: number, review: { rating: number }) => total + review.rating, 0);
      this.avgRating = sum / this.reviews.length;
    } else {
      this.avgRating = 0;
    }
  }
  next();
});

const Product = model<IProduct>('Product', ProductSchema);

export default Product; 