# Production Deployment Guide

This guide will help you deploy your Job Analytics application to production using:
- **Frontend**: Netlify (frontend-new)
- **Backend**: Render
- **Database**: MongoDB Atlas

## Prerequisites

✅ MongoDB Atlas cluster created with connection string:
```
mongodb+srv://giorgosseitar:Ayra1357@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&appName=Cluster0
```

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select this repository
4. Configure:
   - **Name**: `job-analytics-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

### 1.3 Set Environment Variables in Render
Go to "Environment" tab and add these variables:

```env
MONGODB_URI=mongodb+srv://giorgosseitar:Ayra1357@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
PORT=3001
JWT_SECRET=your_super_strong_jwt_secret_key_change_this_now
CORS_ORIGIN=https://your-app-name.netlify.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

⚠️ **Important**: Generate a strong JWT_SECRET using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.4 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend URL will be: `https://job-analytics-api.onrender.com`

### 1.5 Test Backend
Visit: `https://your-backend-api.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "connected"
}
```

## Step 2: Deploy Frontend to Netlify

### 2.1 Update Frontend Environment
Before deploying, update `frontend-new/.env.production`:

```env
NODE_ENV=production
VUE_APP_API_URL=https://your-backend-api.onrender.com/api
VUE_APP_TITLE=Job Analytics Pro
```

Replace `your-backend-api` with your actual Render URL from Step 1.4.

### 2.2 Build Frontend Locally (Optional Test)
```bash
cd frontend-new
npm run build
```

This creates a `dist` folder. Test it works locally:
```bash
npm install -g serve
serve -s dist
```

### 2.3 Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy from frontend-new directory
cd frontend-new
netlify deploy --prod
```

#### Option B: Netlify Dashboard
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `frontend-new/dist` folder
4. Or connect your GitHub repo:
   - Click "Import from Git"
   - Select your repository
   - Configure:
     - **Base directory**: `frontend-new`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend-new/dist`
   - Add environment variable:
     - `VUE_APP_API_URL` = `https://your-backend-api.onrender.com/api`

### 2.4 Configure Custom Domain (Optional)
1. In Netlify dashboard, go to "Domain settings"
2. Add custom domain or use the provided `.netlify.app` domain

### 2.5 Update CORS in Render
After Netlify deployment, update the `CORS_ORIGIN` environment variable in Render:
```
CORS_ORIGIN=https://your-actual-app-name.netlify.app
```

Then trigger a redeploy in Render.

## Step 3: Initialize Database Collections

Since you're using MongoDB, you need to create the initial collections and indexes.

### 3.1 Create Collections

Your MongoDB Atlas cluster needs these collections:
- `users`
- `work_days`
- `expenses`
- `calendar_events`
- `goals`
- `user_hourly_rates`

These will be created automatically when you first use the app, but you can create them manually in MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Click "Collections" → "Create Database"
3. Database name: `job_analytics`
4. Create the collections listed above

### 3.2 Create First User (Registration)
Visit your deployed frontend:
```
https://your-app-name.netlify.app/register
```

Register the first user to test the connection.

## Step 4: Verify Deployment

### 4.1 Backend Health Check
```bash
curl https://your-backend-api.onrender.com/api/health
```

### 4.2 Frontend Check
Visit: `https://your-app-name.netlify.app`

### 4.3 Test Authentication
1. Register a new user
2. Login
3. Check if dashboard loads
4. Test creating work entries, expenses, etc.

## Step 5: Production Checklist

- [ ] MongoDB Atlas IP whitelist set to allow connections from anywhere (0.0.0.0/0)
- [ ] Strong JWT_SECRET generated and set in Render
- [ ] CORS_ORIGIN updated with actual Netlify URL
- [ ] Backend health endpoint returns OK
- [ ] Frontend can connect to backend
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads with data
- [ ] All CRUD operations work
- [ ] MongoDB collections visible in Atlas

## Troubleshooting

### Backend Issues

**Error: MongoDB connection failed**
- Check `MONGODB_URI` is correct in Render environment variables
- Verify MongoDB Atlas IP whitelist allows all IPs (0.0.0.0/0)
- Check MongoDB Atlas user has correct permissions

**Error: CORS issues**
- Update `CORS_ORIGIN` in Render with exact Netlify URL (no trailing slash)
- Redeploy backend after changing CORS settings

### Frontend Issues

**Error: Network request failed**
- Check `VUE_APP_API_URL` points to correct Render backend URL
- Verify backend is running (check Render logs)
- Check browser console for specific error messages

**Error: 401 Unauthorized**
- Clear browser localStorage
- Try logging in again
- Check JWT_SECRET hasn't changed in backend

## URLs

After deployment, save these URLs:

- **Frontend**: `https://your-app-name.netlify.app`
- **Backend**: `https://your-backend-api.onrender.com`
- **API Base**: `https://your-backend-api.onrender.com/api`
- **MongoDB**: `cluster0.h2jp4ey.mongodb.net`

## Environment Variables Summary

### Render (Backend)
```
MONGODB_URI=mongodb+srv://giorgosseitar:Ayra1357@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
PORT=3001
JWT_SECRET=[generate-strong-secret]
CORS_ORIGIN=https://your-app-name.netlify.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Netlify (Frontend)
```
VUE_APP_API_URL=https://your-backend-api.onrender.com/api
NODE_ENV=production
```

## Monitoring

### Render Logs
View backend logs: Render Dashboard → Your Service → Logs

### Netlify Logs
View deploy logs: Netlify Dashboard → Your Site → Deploys

### MongoDB Atlas
View database metrics: MongoDB Atlas Dashboard → Metrics

## Cost Estimate

- **MongoDB Atlas**: Free (M0 cluster, 512MB storage)
- **Render**: Free tier (with limitations) or $7/month for Starter
- **Netlify**: Free (100GB bandwidth/month)

**Total**: $0-7/month

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas allows connections from Render IPs

---

**Next Steps**: Follow this guide step by step, and your application will be live in production! 🚀
