## MongoDB Authentication Fix Guide

### Current Situation:
- User exists: ✅ `giorgosseitar`
- Role: ✅ `atlasAdmin@admin`
- Connection: ❌ Authentication failing

### Most Likely Issue:
The password in your .env file doesn't match the actual MongoDB Atlas password.

### Solution Steps:

#### Option 1: Reset Password (Recommended)

1. **Go to MongoDB Atlas**:
   - Visit: https://cloud.mongodb.com/
   - Navigate to your project
   - Click "Database Access" in left sidebar

2. **Reset Password**:
   - Find user `giorgosseitar`
   - Click "EDIT" button
   - Click "Edit Password"
   - Choose "Autogenerate Secure Password" OR set custom password
   - **COPY THE PASSWORD** (you won't see it again!)
   - Click "Update User"

3. **Update .env file**:
   ```env
   MONGODB_URI=mongodb+srv://giorgosseitar:YOUR_NEW_PASSWORD@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&authSource=admin
   ```
   Replace `YOUR_NEW_PASSWORD` with the actual password

4. **If password has special characters**, URL-encode them:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `^` → `%5E`
   - `&` → `%26`
   - `*` → `%2A`

   Example:
   - Password: `Pass@123!`
   - Encoded: `Pass%40123%21`

#### Option 2: Create New User (Alternative)

1. **Create new database user**:
   - Go to Database Access
   - Click "ADD NEW DATABASE USER"
   - Authentication Method: **Password**
   - Username: `jobanalytics_admin`
   - Password: `JobAnalytics2024` (simple, no special chars)
   - Database User Privileges: **Built-in Role** → `Atlas admin`
   - Click "Add User"

2. **Update .env**:
   ```env
   MONGODB_URI=mongodb+srv://jobanalytics_admin:JobAnalytics2024@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&authSource=admin
   ```

#### Option 3: Get Connection String from Atlas

1. **Get fresh connection string**:
   - In MongoDB Atlas, click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js
   - Version: 4.1 or later
   - **Copy the connection string**

2. **Replace <password>**:
   - The string will look like: `mongodb+srv://giorgosseitar:<password>@cluster0.h2jp4ey.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password
   - Add `/job_analytics` before the `?` to specify database

### After Updating .env:

Test the connection:
```bash
npm run test:mongo
```

Or start the server:
```bash
npm start
```

### Important Checks:

✅ **IP Whitelist**:
- Go to "Network Access" in MongoDB Atlas
- Make sure your IP is listed OR add `0.0.0.0/0` (allow all IPs)

✅ **Cluster Status**:
- Make sure cluster is running (not paused)
- Check cluster name matches: `cluster0`

✅ **User Exists**:
- User `giorgosseitar` is in "Database Access"
- Status shows as "Active"

### Need Help?

If still failing, please provide:
1. The exact error message
2. Your masked connection string (with password as ****)
3. Screenshot of Database Access page showing the user
