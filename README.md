


```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Authentication & Database)

## Environment Variables

This project requires the following environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

Create a `.env` file in the root directory with these variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project: Project Settings → API

## Deployment to Render

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
     - `PORT` - (Optional, defaults to 3000)

4. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Local Testing

To test the production build locally:

```sh
# Build the project
npm run build

# Start the production server
npm start
```

The app will be available at `http://localhost:3000` (or the PORT you specified).

