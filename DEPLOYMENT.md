# Deployment Checklist for Render

## ✅ Completed Setup

### 1. Package.json Configuration
- ✅ Added `"start": "node server.js"` script
- ✅ Added `express` as a dependency
- ✅ Added `@types/express` as a dev dependency

### 2. Server Configuration
- ✅ Created `server.js` to serve static files from `dist/` folder
- ✅ Server handles client-side routing (SPA)
- ✅ Server uses `PORT` environment variable (defaults to 3000)

### 3. Environment Variables
- ✅ Updated `src/integrations/supabase/client.ts` to use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Updated `src/lib/supabaseClient.ts` to use environment variables
- ✅ Added `.env` files to `.gitignore`
- ✅ Environment variables have fallback values for development

### 4. Build Configuration
- ✅ Vite is configured to build to `dist/` folder
- ✅ Build command: `npm run build`
- ✅ Start command: `npm start`

## 📋 Pre-Deployment Checklist

### Before Pushing to GitHub:
1. ✅ All changes committed
2. ✅ `.env` file is NOT committed (already in `.gitignore`)
3. ✅ `node_modules` is NOT committed (already in `.gitignore`)
4. ✅ `dist` folder is NOT committed (already in `.gitignore`)

### Before Deploying on Render:
1. Push your code to GitHub
2. Create a Render account (if you don't have one)
3. Connect your GitHub repository to Render

## 🚀 Render Deployment Steps

### Step 1: Create New Web Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository and branch

### Step 2: Configure Build Settings
- **Name:** Your app name (e.g., "shop-spark-45")
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Choose your plan (Free tier available)

### Step 3: Add Environment Variables
In the Environment section, add:

```
VITE_SUPABASE_URL=https://spagewdjddxmehzppwuq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYWdld2RqZGR4bWVoenBwd3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTQ5OTksImV4cCI6MjA3MjQ5MDk5OX0.YuRW-m1XWlQWD6BMJST0eWcRmBTdju141scUi_3JIOk
PORT=3000
```

**Note:** Replace the Supabase values with your actual values if different.

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies
   - Build the project (`npm run build`)
   - Start the server (`npm start`)
3. Wait for deployment to complete
4. Your app will be available at `https://your-app-name.onrender.com`

## 🧪 Local Testing

Test the production build locally before deploying:

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start the production server
npm start
```

Visit `http://localhost:3000` to verify everything works.

## ⚠️ Important Notes

1. **Environment Variables:** Make sure to add all required environment variables in Render's dashboard. The app will use fallback values if not set, but it's recommended to set them explicitly.

2. **Build Output:** The `dist/` folder is created during the build process and contains all static files that the Express server serves.

3. **Client-Side Routing:** The server is configured to handle React Router's client-side routing by serving `index.html` for all routes.

4. **Supabase Edge Functions:** The Supabase edge functions in `supabase/functions/` run on Supabase's infrastructure, not on Render. They use different environment variables (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) which should be configured in Supabase's dashboard.

## 🔍 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Render dashboard

### App Doesn't Start
- Verify `npm start` works locally
- Check that `dist/` folder exists after build
- Verify environment variables are set correctly

### 404 Errors on Routes
- Ensure the server.js catch-all route is working
- Check that `index.html` is in the `dist/` folder

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check Supabase project settings
- Ensure CORS is configured in Supabase dashboard

## 📝 Files Modified/Created

### Created:
- `server.js` - Express server for serving static files
- `DEPLOYMENT.md` - This file

### Modified:
- `package.json` - Added start script and express dependency
- `src/integrations/supabase/client.ts` - Added environment variable support
- `src/lib/supabaseClient.ts` - Added environment variable support
- `.gitignore` - Added .env files
- `README.md` - Added deployment instructions

