# InfinityFree Production Deployment Guide

This guide will help you deploy the Job Analytics application to InfinityFree hosting.

## Prerequisites

1. InfinityFree account
2. MySQL database created on InfinityFree
3. Node.js installed locally for building

## Step 1: Database Setup

1. Create a MySQL database in your InfinityFree control panel
2. Note down your database credentials:
   - Host (usually sql102.infinityfree.com or similar)
   - Username
   - Password
   - Database name

## Step 2: Backend Configuration

1. Update `backend/.env.production` with your database credentials:
```bash
DB_HOST=sql102.infinityfree.com
DB_USER=your_actual_username
DB_PASSWORD=your_actual_password
DB_NAME=your_actual_database_name
CORS_ORIGIN=https://yourdomain.infinityfreeapp.com
JWT_SECRET=generate_a_strong_secret_key_here
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Run database setup:
```bash
npm run setup-db
```

## Step 3: Frontend Build

1. Update `frontend/.env.production` if needed
2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Build for production:
```bash
npm run build
```

## Step 4: File Upload to InfinityFree

1. **Upload Frontend Files:**
   - Upload all files from `frontend/dist/` to your `htdocs` folder
   - Make sure `index.html` is in the root of `htdocs`

2. **Upload Backend Files:**
   - Create an `api` folder in `htdocs`
   - Upload all backend files to `htdocs/api/`
   - Make sure `.env.production` is renamed to `.env` in the api folder

## Step 5: .htaccess Configuration

Create `.htaccess` in your `htdocs` root:

```apache
# Frontend routing
RewriteEngine On
RewriteBase /

# API routing
RewriteRule ^api/(.*)$ api/server.js [L,QSA]

# Frontend routing (Vue Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L,QSA]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Step 6: Testing

1. Visit your domain
2. Test login/registration
3. Test all features
4. Check browser console for errors

## Troubleshooting

### Common Issues:

1. **Database Connection Failed:**
   - Verify database credentials in `.env`
   - Ensure database is created
   - Check if IP restrictions apply

2. **API Calls Failing:**
   - Verify `.htaccess` is correct
   - Check CORS settings
   - Ensure backend files are in `api/` folder

3. **Login Not Working:**
   - Check JWT secret is set
   - Verify authentication routes
   - Check browser network tab for errors

4. **Files Not Loading:**
   - Verify all files uploaded correctly
   - Check file permissions
   - Clear browser cache

### InfinityFree Specific Notes:

1. **Node.js Limitation:** InfinityFree doesn't natively support Node.js. You'll need to use a service like Vercel, Heroku, or Railway for the backend API.

2. **Alternative Backend Hosting:**
   - Deploy backend to Vercel/Heroku
   - Update `VUE_APP_API_URL` in `.env.production`
   - Update CORS settings accordingly

3. **Database Connection:**
   - Use the exact host provided by InfinityFree
   - Connection may be slower than premium hosting
   - Consider connection pooling for better performance

## Recommended Alternative for Full Stack:

Since InfinityFree doesn't support Node.js backends, consider:

1. **Frontend:** InfinityFree (free)
2. **Backend:** Railway/Heroku (free tier)
3. **Database:** Railway/Heroku PostgreSQL or keep MySQL on InfinityFree

This setup provides the best performance and reliability for your application.
