# AI-Powered E-Commerce Platform

A full-stack AI-enabled e-commerce platform built with **React.js** and **Django REST Framework**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Axios |
| Backend | Python, Django REST Framework |
| Database | SQLite (dev) / MySQL (prod) |
| Auth | JWT (SimpleJWT) |
| Payments | Razorpay Integration |
| AI/ML | Personalized Recommendations |

## Quick Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-powered-ecommerce-platform.git
cd ai-powered-ecommerce-platform
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux

# Run migrations
python manage.py migrate

# Seed sample data (products, users, coupons)
python manage.py seed_data

# Start backend server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecommerce.com | admin123 |
| Seller | seller@ecommerce.com | seller123 |
| Customer | customer@ecommerce.com | customer123 |

## Coupon Codes

| Code | Discount | Min Order |
|------|----------|-----------|
| WELCOME10 | 10% off | Rs.500 |
| FLAT50 | Rs.50 off | Rs.299 |
| SAVE20 | 20% off | Rs.1,000 |
| MEGA100 | Rs.100 off | Rs.999 |
| FIRST15 | 15% off | Rs.0 |
| FESTIVE25 | 25% off | Rs.2,000 |

## Features

- User registration & JWT authentication
- Product catalog with 8 categories, 41 products
- Category filtering, search, price range, rating filters
- Shopping cart (add/update/remove)
- Checkout with Razorpay payment integration
- Coupon code system with validation
- AI-powered recommendations (For You, Similar, Trending, Frequently Bought Together)
- Order management & tracking
- Seller dashboard
- Responsive design

## Project Structure

```
ai-powered-ecommerce-platform/
├── backend/
│   ├── accounts/          # User auth & JWT
│   ├── products/          # Products, categories, reviews
│   ├── cart/              # Shopping cart
│   ├── orders/            # Orders & Razorpay payments
│   ├── coupons/           # Coupon code system
│   ├── recommendations/   # AI recommendation engine
│   └── ecommerce_platform/  # Django settings
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, Footer, ProductCard
│   │   ├── pages/         # Home, Products, Cart, Checkout
│   │   └── utils/         # API client, auth helpers
│   └── public/            # Static assets & logo
└── README.md
```
