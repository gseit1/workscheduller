# 🚀 Deployment Guide - Job Analytics

This guide will help you deploy the Job Analytics application with:
- **Frontend** → Netlify
- **Backend** → Render  
- **Database** → MongoDB Atlas

---

## 📋 Prerequisites

Before deploying, make sure you have:

1. ✅ GitHub account
2. ✅ Netlify account (free tier)
3. ✅ Render account (free tier)
4. ✅ MongoDB Atlas account (free tier)
5. ✅ Your code pushed to a GitHub repository

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create a Cluster**
   - Choose FREE tier (M0 Sandbox)
   - Select a region closest to your users
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `analytics_user` (or your choice)
   - Generate a strong password and **save it!**
   - Set role to "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Render to connect

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password
   - Add database name: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/job_analytics?retryWrites=true&w=majority`

---

## 🔧 Step 2: Deploy Backend to Render

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `job-analytics-api` (or your choice)
     - **Region**: Oregon (US West) or nearest to you
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Add Environment Variables**
   Click "Advanced" → Add Environment Variables:
   
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/job_analytics?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
   CORS_ORIGIN=https://your-app-name.netlify.app
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

   **Important Notes:**
   - Replace `MONGODB_URI` with your actual MongoDB connection string
   - Generate a strong random string for `JWT_SECRET` (at least 32 characters)
   - Leave `CORS_ORIGIN` as is for now, we'll update it after deploying frontend

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build and deploy
   - Your backend URL will be: `https://job-analytics-api.onrender.com` (or your chosen name)
   - **Save this URL!** You'll need it for frontend

6. **Test Backend**
   - Visit: `https://your-backend-url.onrender.com/api/auth/health`
   - Should return: `{"status":"healthy","timestamp":"...","service":"job-analytics-api"}`

---

## 🎨 Step 3: Deploy Frontend to Netlify

1. **Update Frontend Environment**
   
   Open `frontend-new/.env.production` and update:
   ```
   VUE_APP_API_URL=https://job-analytics-api.onrender.com
   ```
   Replace with your actual Render backend URL (without /api at the end)

2. **Commit Changes**
   ```bash
   git add frontend-new/.env.production
   git commit -m "Update production API URL"
   git push origin main
   ```

3. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up with GitHub

4. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Select your repository
   - Configure build settings:
     - **Base directory**: `frontend-new`
     - **Build command**: `npm install && npm run build`
     - **Publish directory**: `frontend-new/dist`
     - **Branch**: `main`

5. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     ```
     VUE_APP_API_URL=https://job-analytics-api.onrender.com
     ```
   (Replace with your actual backend URL)

6. **Deploy**
   - Click "Deploy site"
   - Wait 3-5 minutes
   - Your site will be live at: `https://random-name-123.netlify.app`

7. **Custom Domain (Optional)**
   - Go to Domain settings
   - Click "Add custom domain"
   - Follow instructions to connect your domain

---

## 🔄 Step 4: Update Backend CORS

Now that frontend is deployed, update the backend CORS setting:

1. Go to Render Dashboard → Your Backend Service
2. Go to "Environment" tab
3. Update `CORS_ORIGIN` to your Netlify URL:
   ```
   CORS_ORIGIN=https://your-app-name.netlify.app
   ```
4. Click "Save Changes"
5. Render will automatically redeploy

---

## ✅ Step 5: Test Your Deployment

1. **Visit Your Frontend**
   - Go to your Netlify URL
   - Try to register a new account
   - Login
   - Add some work data
   - Check if everything works

2. **Check Service Worker**
   - Open Chrome DevTools → Application tab
   - Check Service Workers are registered
   - Test offline mode (Network tab → Offline checkbox)

3. **Install as PWA**
   - On mobile: Add to home screen
   - On desktop: Look for install icon in address bar

---

## 🔧 Troubleshooting

### Backend Issues

**"Application failed to start"**
- Check environment variables are set correctly
- Check MongoDB connection string is valid
- View logs in Render dashboard

**"CORS Error"**
- Make sure `CORS_ORIGIN` matches your Netlify URL exactly
- Include `https://` protocol
- No trailing slash

**"MongoDB Connection Failed"**
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Verify connection string is correct
- Check username/password has no special characters that need encoding

### Frontend Issues

**"Failed to fetch"**
- Check `VUE_APP_API_URL` environment variable in Netlify
- Make sure it points to your Render backend URL
- Check backend health endpoint works

**"404 on refresh"**
- Make sure `netlify.toml` is in root directory
- Check redirects are configured correctly

**"Build failed"**
- Check Node version (should be 20)
- View build logs in Netlify
- Make sure all dependencies are in package.json

---

## 🎉 You're Done!

Your Job Analytics app is now live on the internet!

### Important URLs to Save:

- **Frontend**: https://your-app-name.netlify.app
- **Backend**: https://job-analytics-api.onrender.com
- **MongoDB**: Check Atlas dashboard

### Next Steps:

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring/alerts
4. ✅ Set up CI/CD for automatic deployments
5. ✅ Add analytics (Google Analytics, etc.)

### Free Tier Limitations:

**Render Free Tier:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- 750 hours/month free

**Netlify Free Tier:**
- 100GB bandwidth/month
- 300 build minutes/month
- Automatic SSL
- Global CDN

**MongoDB Atlas Free Tier:**
- 512MB storage
- No backup/restore
- Shared CPU

### Upgrade for Better Performance:

If your app grows, consider upgrading:
- **Render**: $7/month for always-on instance
- **Netlify**: $19/month for more bandwidth
- **MongoDB**: $9/month for dedicated cluster

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vue.js Production Deployment](https://vuejs.org/guide/best-practices/production-deployment.html)

---

## 🆘 Need Help?

If you encounter issues:

1. Check application logs (Render dashboard → Logs)
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Test backend health endpoint
5. Check MongoDB Atlas connection

---

**Happy Deploying! 🚀**
