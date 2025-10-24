# MongoDB Connection String Helper

The password `Ayra1357` needs to be URL-encoded if it contains special characters.

## Current Connection String Issues

Your current connection string:
```
mongodb+srv://giorgosseitar:Ayra1357@cluster0.h2jp4ey.mongodb.net/job_analytics
```

## Things to Check:

### 1. Verify Credentials in MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Login to your account
3. Click on "Database Access" in the left sidebar
4. Verify the username is: `giorgosseitar`
5. If password is incorrect, click "Edit" and reset it

### 2. Check IP Whitelist
1. In MongoDB Atlas, click "Network Access"
2. Make sure `0.0.0.0/0` is in the IP Access List (allows all IPs)
3. Or add your specific IP address

### 3. URL-Encode Password
If your password contains special characters, it must be URL-encoded:

- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `^` becomes `%5E`
- `&` becomes `%26`
- `*` becomes `%2A`

For password `Ayra1357` (no special chars), it should work as-is.

### 4. Try Alternative Connection String Format

Option 1 - Standard connection (not SRV):
```
mongodb://giorgosseitar:Ayra1357@cluster0-shard-00-00.h2jp4ey.mongodb.net:27017,cluster0-shard-00-01.h2jp4ey.mongodb.net:27017,cluster0-shard-00-02.h2jp4ey.mongodb.net:27017/job_analytics?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

Option 2 - Get correct connection string from Atlas:
1. Go to MongoDB Atlas Dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" driver version 4.1 or later
5. Copy the connection string
6. Replace `<password>` with your actual password

### 5. Common Issues

**Wrong Database User**: 
- Make sure you're using DATABASE USER credentials, NOT your MongoDB Atlas account credentials
- Database users are created in "Database Access" section

**User Not Created**:
- The user `giorgosseitar` might not exist
- Create a new database user with a simple password (e.g., `testpass123`)

**IP Not Whitelisted**:
- Add `0.0.0.0/0` to Network Access to allow all IPs

### 6. Create New Database User

In MongoDB Atlas:
1. Go to "Database Access"
2. Click "Add New Database User"
3. Use "Password" authentication
4. Username: `jobanalytics_user`
5. Password: `JobAnalytics2024!` (remember to URL-encode special chars)
6. Built-in Role: `Read and write to any database`
7. Click "Add User"

Then update `.env`:
```env
MONGODB_URI=mongodb+srv://jobanalytics_user:JobAnalytics2024%21@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&appName=Cluster0
```

Note: `!` is encoded as `%21`

### 7. Test with MongoDB Compass

Download MongoDB Compass and try connecting with the same connection string. This will help verify if credentials are correct.

## Recommended Next Steps:

1. **Verify user exists** in MongoDB Atlas → Database Access
2. **Check IP whitelist** in Network Access (add 0.0.0.0/0)
3. **Get fresh connection string** from Atlas → Connect → Connect your application
4. **Create new user** with simple password if needed
5. **Update .env file** with correct connection string
