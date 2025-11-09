# ShopSpark - E-Commerce Platform

A modern, full-stack e-commerce website built with React, Vite, Supabase, and Razorpay payment integration.

## 🚀 Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite 7
- **UI Components:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL + Auth)
- **Payment Gateway:** Razorpay
- **Routing:** React Router DOM
- **State Management:** React Context API
- **Deployment:** Render (Node.js server)

## 📋 Features

- ✅ User Authentication (Sign up, Login, Logout)
- ✅ Product Catalog with Categories
- ✅ Product Search & Filtering
- ✅ Shopping Cart Management
- ✅ Secure Payment Integration (Razorpay)
- ✅ Order Management & Tracking
- ✅ Order History with 2-3 Day Delivery Estimates
- ✅ Real-time Stock Updates
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Help & Support Page
- ✅ Wishlist Functionality

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Razorpay account (for payments)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GIT_URL>
   cd shop-spark-45
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Razorpay Configuration
   VITE_RAZORPAY_KEY_TEST=rzp_test_xxxxxxxxxxxxx
   VITE_RAZORPAY_KEY_LIVE=rzp_live_xxxxxxxxxxxxx
   VITE_RAZORPAY_KEY=rzp_test_xxxxxxxxxxxxx
   ```

   **Where to find these values:**
   - **Supabase:** Project Settings → API
   - **Razorpay:** Dashboard → Settings → API Keys

4. **Set up Supabase Database:**
   
   Run these SQL migrations in Supabase SQL Editor (in order):
   - `supabase/migrations/20251103_create_orders.sql`
   - `supabase/migrations/20250101_update_orders_schema.sql`
   - `supabase/migrations/20250103_fix_orders_rls_for_guests.sql`
   - `supabase/migrations/20250105_fix_orders_complete.sql` (or `QUICK_FIX_RUN_THIS.sql`)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm start` - Start production server (after build)
- `npm run lint` - Run ESLint

## 🚢 Deployment to Render

### Prerequisites
1. Push your code to GitHub
2. Have a Render account (sign up at https://render.com)

### Steps

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Select the repository and branch

2. **Configure the service:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

3. **Add Environment Variables:**
   - Go to the Environment section
   - Add the following variables:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
     - `VITE_RAZORPAY_KEY_TEST` - Your Razorpay test key
     - `VITE_RAZORPAY_KEY_LIVE` - Your Razorpay live key
     - `VITE_RAZORPAY_KEY` - Your Razorpay key (fallback)
     - `PORT` - (Optional, defaults to 3000)

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Local Production Testing

```bash
# Build the project
npm run build

# Start the production server
npm start
```

The app will be available at `http://localhost:3000` (or the PORT you specified).

## 🔒 Security Notes

- **Environment Variables:** Never commit `.env` files to version control
- **API Keys:** The Supabase anon key is safe to expose (it's public), but always use environment variables in production
- **Razorpay Keys:** Use test keys for development, live keys only in production
- **Service Role Keys:** Never expose Supabase service role keys in frontend code

## 📁 Project Structure

```
shop-spark-45/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, Cart)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   └── App.tsx           # Main app component
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── server.js             # Express server for production
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### Order Creation Fails
- Ensure you've run all SQL migrations in Supabase
- Check that the `amount` column exists in the `orders` table
- Verify RLS policies allow order insertion

### Payment Not Working
- Verify Razorpay keys are set in environment variables
- Check that Razorpay checkout script is loaded in `index.html`
- Ensure you're using test keys for development

### Images Not Loading
- Check Supabase storage bucket configuration
- Verify image URLs in product data
- Ensure storage bucket has public access

## 📝 License

This project is private and proprietary.

## 👥 Support

For issues or questions, contact:
- **Rushikesh:** 9545952804
- **Krishna:** 8261048075

Or visit the Help page in the application.
