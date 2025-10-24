# 📋 Quick Deployment Checklist

## Before Deployment

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] Strong JWT secret generated (32+ characters)

## Backend Deployment (Render)

- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=3001
  - [ ] MONGODB_URI=[your connection string]
  - [ ] JWT_SECRET=[your secret]
  - [ ] CORS_ORIGIN=[will update after frontend deploy]
  - [ ] RATE_LIMIT_WINDOW=15
  - [ ] RATE_LIMIT_MAX=100
- [ ] Deploy and wait for success
- [ ] Test health endpoint: /api/auth/health
- [ ] **Save backend URL**

## Frontend Deployment (Netlify)

- [ ] Update `.env.production` with backend URL
- [ ] Commit and push changes
- [ ] Create Netlify account
- [ ] Create new site from GitHub
- [ ] Set base directory: `frontend-new`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `frontend-new/dist`
- [ ] Add environment variable:
  - [ ] VUE_APP_API_URL=[your backend URL]
- [ ] Deploy and wait for success
- [ ] **Save frontend URL**

## Post-Deployment

- [ ] Update CORS_ORIGIN in Render with Netlify URL
- [ ] Wait for Render auto-redeploy
- [ ] Test registration on live site
- [ ] Test login
- [ ] Test adding work data
- [ ] Test PWA installation
- [ ] Test offline mode

## Optional Enhancements

- [ ] Set up custom domain on Netlify
- [ ] Configure Netlify Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup strategy for MongoDB
- [ ] Set up uptime monitoring

---

**Current Status:**

| Service | Status | URL |
|---------|--------|-----|
| Frontend | ⏳ Pending | |
| Backend | ⏳ Pending | |
| Database | ⏳ Pending | |

---

**Update this checklist as you complete each step!**
