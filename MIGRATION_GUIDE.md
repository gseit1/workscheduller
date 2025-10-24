# MySQL to MongoDB Migration Guide

## Overview
This script migrates all your data from MySQL to MongoDB Atlas.

## What Gets Migrated

✅ **Users** - All user accounts with passwords (hashed)
✅ **Work Days** - All work entries with hours, rates, tips
✅ **Expenses** - All income and expense records
✅ **Calendar Events** - All scheduled events (if table exists)
✅ **Goals** - All financial goals (if table exists)

## Prerequisites

1. **MySQL Server** must be running (XAMPP)
2. **MongoDB Atlas** connection working
3. **Both credentials** in `.env` file

## Steps to Migrate

### 1. Make sure XAMPP MySQL is running

Start XAMPP and ensure MySQL is running.

### 2. Verify .env file has both MySQL and MongoDB credentials

```env
# MySQL (temporary for migration)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=job_analytics

# MongoDB Atlas
MONGODB_URI=mongodb+srv://giorgosseitar:NewPassword123@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority&authSource=admin
```

### 3. Run the migration script

```bash
cd C:\xampp\htdocs\jobAnalytics\backend
npm run migrate:to-mongodb
```

### 4. Verify the migration

The script will show:
- How many records found in MySQL
- How many records inserted into MongoDB
- Verification counts

### 5. Test your application

Start the backend:
```bash
npm start
```

Start the frontend:
```bash
cd ../frontend-new
npm run serve
```

Login and verify all your data is there!

## What Happens

- ✅ **MySQL data preserved** - Nothing is deleted from MySQL
- ✅ **User IDs mapped** - MySQL IDs are converted to MongoDB ObjectIds
- ✅ **Relationships maintained** - All user-to-data relationships preserved
- ✅ **Indexes created** - MongoDB indexes for performance
- ✅ **Data types converted** - MySQL types → MongoDB types

## Field Mappings

### Users
```
MySQL              → MongoDB
id                 → _id (ObjectId)
username           → username
email              → email
password_hash      → password
hourly_rate        → hourlyRate
created_at         → createdAt
updated_at         → updatedAt
```

### Work Days
```
MySQL              → MongoDB
id                 → _id (ObjectId)
user_id            → userId (ObjectId reference)
work_date          → workDate (Date)
hours_worked       → hoursWorked
hourly_rate        → hourlyRate
tips_amount        → tipsAmount
payment_status     → paymentStatus
payment_date       → paymentDate
```

### Expenses
```
MySQL              → MongoDB
id                 → _id (ObjectId)
user_id            → userId (ObjectId reference)
type               → type
category           → category
description        → description
amount             → amount
expense_date       → expenseDate (Date)
```

## After Migration

1. **Comment out MySQL credentials** in `.env` (no longer needed)
2. **Keep MySQL data** as backup (don't delete)
3. **Use MongoDB** for all operations going forward

## Troubleshooting

### Error: "Cannot connect to MySQL"
- Make sure XAMPP MySQL is running
- Check MySQL credentials in `.env`

### Error: "Cannot connect to MongoDB"
- Verify MongoDB Atlas password
- Check IP whitelist in MongoDB Atlas

### Error: "Duplicate key error"
- MongoDB already has data
- Clear MongoDB collections first or use different database name

## Rollback

If you need to rollback:
1. Stop the backend server
2. Drop MongoDB collections in Atlas
3. Re-run migration script

## Support

If migration fails:
1. Check terminal output for specific error
2. Verify both databases are accessible
3. Check `.env` credentials
4. Make sure no unique constraint violations

---

**Note:** This is a one-time migration. After successful migration, you'll use MongoDB exclusively.
