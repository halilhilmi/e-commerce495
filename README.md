# Modern E-Commerce Platform

A full-featured e-commerce web application with a REST API backend built with Node.js, Express, TypeScript, and MongoDB, and a front-end built with HTML, CSS, and JavaScript.

## Deployment

The application is deployed on Vercel and accessible at: [e-commerce-platform.vercel.app](https://e-commerce495.vercel.app)

## GitHub Repository

This project is available on GitHub: [https://github.com/halilhilmi/e-commerce495](https://github.com/halilhilmi/e-commerce495)

## User Credentials

### Regular User
- Email: user@example.com
- Password: password123

### Admin User
- Email: admin@example.com
- Password: admin123

## Features

- **User Authentication**: Register, login, session management with JWT
- **User Profiles**: View and edit user information
- **Product Management**: Browse, search, and filter products
- **Admin Dashboard**: Manage products and user accounts
- **Reviews and Ratings**: Rate products and read reviews from other users

## Design Decisions

### Why TypeScript?
TypeScript was chosen for its strong typing system which helps catch errors during development rather than at runtime. This improves code quality and developer productivity, especially in a larger application with multiple models and interfaces. Also, the main reason using of this framework is having experience.

### Framework Choices

#### Backend
- **Express.js**: Selected for its minimalistic approach, flexibility, and extensive middleware ecosystem.
- **Mongoose**: Provides a schema-based solution for MongoDB modeling, which helps maintain data consistency.
- **JWT Authentication**: Offers a stateless authentication mechanism ideal for RESTful APIs.

#### Frontend
- **Vanilla JS with Bootstrap 5**: Kept the frontend simple and lightweight without introducing complex frameworks, while Bootstrap provides responsive design components.

### Database Design
MongoDB was chosen for its flexibility with document-based storage, which works well for an e-commerce platform where product attributes may vary significantly between categories.

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Typed JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Winston** - Logging

### Frontend
- **HTML** - Markup language
- **CSS** - Styling (with Bootstrap 5)
- **JavaScript** - Client-side logic
- **Bootstrap 5** - CSS framework

## Project Structure

```
├── public/                # Frontend static files
│   ├── css/               # CSS stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Image assets
│   ├── index.html         # Main application page
│   ├── profile.html       # User profile page
│   ├── admin.html         # Admin dashboard
│   └── edit-product.html  # Product editing page
│
├── src/                   # Backend source code
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── interfaces/        # TypeScript interfaces
│   ├── middlewares/       # Express middlewares
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # Main routes file
│   └── server.ts          # Server startup
│
├── .env                   # Environment variables
├── vercel.json            # Vercel deployment configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/reviews` - Get reviews by user

### Products
- `GET /api/products` - Get all products (with filtering and pagination)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `POST /api/products/:id/reviews` - Add a review for a product

## User Guide

### For Shoppers
1. Browse products on the home page
2. Use the search bar and category filters to find specific items
3. Click on a product to view details and reviews
4. Register or login to leave reviews and ratings
5. View your profile to see your review history

### For Administrators
1. Login with admin credentials
2. Access the admin panel from the user dropdown menu
3. Manage products (add, edit, delete)
4. View and manage user accounts

## Development Approach
This application follows a traditional MVC architecture with a RESTful API backend and a simple frontend that consumes this API. The separation of concerns allows for easier maintenance and future expansion.

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   # Database connection
   DATABASE_USERNAME=yourusername
   DATABASE_PASSWORD=yourpassword
   DATABASE_HOST=localhost
   DATABASE_PORT=27017
   DATABASE_NAME=ecommerce
   DATABASE_PROTOCOL=mongodb
   
   # JWT authentication
   ACCESS_SECRET_KEY=your_access_secret_key
   ACCESS_EXPIRES_IN=15m
   REFRESH_SECRET_KEY=your_refresh_secret_key
   REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Deployment

This application is configured for deployment on Vercel with the included `vercel.json` configuration file.

## Running in Production

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

