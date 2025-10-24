require('dotenv').config();
const mysql = require('mysql2/promise');
const { MongoClient, ObjectId } = require('mongodb');

// MySQL Configuration
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_analytics'
};

// MongoDB Configuration
const mongoUri = process.env.MONGODB_URI;

async function migrateData() {
  let mysqlConnection;
  let mongoClient;
  
  try {
    console.log('\n🔄 Starting Data Migration from MySQL to MongoDB\n');
    console.log('=' .repeat(60));
    
    // Connect to MySQL
    console.log('\n1️⃣  Connecting to MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('   ✅ MySQL connected');
    
    // List all tables
    const [tables] = await mysqlConnection.execute('SHOW TABLES');
    console.log(`   📋 Found ${tables.length} tables in database:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`      - ${tableName}`);
    });
    
    // Connect to MongoDB
    console.log('\n2️⃣  Connecting to MongoDB...');
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db('job_analytics');
    console.log('   ✅ MongoDB connected');
    
    // Get collections
    const usersCollection = db.collection('users');
    const workDaysCollection = db.collection('work_days');
    const expensesCollection = db.collection('expenses');
    const calendarEventsCollection = db.collection('calendar_events');
    const goalsCollection = db.collection('goals');
    
    // Migrate Users
    console.log('\n3️⃣  Migrating Users...');
    const [mysqlUsers] = await mysqlConnection.execute('SELECT * FROM user');
    console.log(`   Found ${mysqlUsers.length} users in MySQL`);
    
    const userIdMap = {}; // Map MySQL IDs to MongoDB ObjectIds
    let migratedUsers = 0;
    let skippedUsers = 0;
    
    if (mysqlUsers.length > 0) {
      for (const mysqlUser of mysqlUsers) {
        // Check if user already exists by email
        const existingUser = await usersCollection.findOne({ email: mysqlUser.email });
        
        if (existingUser) {
          // User exists, map the ID
          userIdMap[mysqlUser.id] = existingUser._id;
          skippedUsers++;
          console.log(`   ⏭️  Skipped existing user: ${mysqlUser.username}`);
        } else {
          // Create new user
          const mongoUserId = new ObjectId();
          userIdMap[mysqlUser.id] = mongoUserId;
          
          const mongoUser = {
            _id: mongoUserId,
            username: mysqlUser.username,
            email: mysqlUser.email,
            password: mysqlUser.password_hash,
            hourlyRate: parseFloat(mysqlUser.hourly_rate) || 15,
            currency: mysqlUser.currency || 'EUR',
            createdAt: mysqlUser.created_at || new Date(),
            updatedAt: mysqlUser.updated_at || new Date()
          };
          
          await usersCollection.insertOne(mongoUser);
          migratedUsers++;
          console.log(`   ✅ Migrated user: ${mysqlUser.username}`);
        }
      }
      console.log(`   Summary: ${migratedUsers} migrated, ${skippedUsers} skipped (already exist)`);
    }
    
    // Migrate Work Days
    console.log('\n4️⃣  Migrating Work Days...');
    let mysqlWorkDays = [];
    try {
      // Try different possible table names
      try {
        [mysqlWorkDays] = await mysqlConnection.execute('SELECT * FROM work_days ORDER BY work_date DESC');
      } catch (e1) {
        try {
          [mysqlWorkDays] = await mysqlConnection.execute('SELECT * FROM work_day ORDER BY work_date DESC');
        } catch (e2) {
          [mysqlWorkDays] = await mysqlConnection.execute('SELECT * FROM workday ORDER BY work_date DESC');
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Work days table not found: ${error.message}`);
      mysqlWorkDays = [];
    }
    
    console.log(`   Found ${mysqlWorkDays.length} work days in MySQL`);
    
    if (mysqlWorkDays.length > 0) {
      for (const mysqlWork of mysqlWorkDays) {
        // Get the user's hourly rate if work_days doesn't have hourly_rate column
        const userId = userIdMap[mysqlWork.user_id];
        const user = await usersCollection.findOne({ _id: userId });
        const hourlyRate = mysqlWork.hourly_rate ? parseFloat(mysqlWork.hourly_rate) : user.hourlyRate;
        
        const mongoWork = {
          userId: userId,
          workDate: new Date(mysqlWork.work_date),
          hoursWorked: parseFloat(mysqlWork.hours_worked),
          hourlyRate: hourlyRate,
          tipsAmount: parseFloat(mysqlWork.tips_amount) || 0,
          notes: mysqlWork.notes || '',
          paymentStatus: mysqlWork.payment_status || 'pending',
          paymentDate: mysqlWork.payment_date ? new Date(mysqlWork.payment_date) : null,
          createdAt: mysqlWork.created_at || new Date(),
          updatedAt: mysqlWork.updated_at || new Date()
        };
        
        await workDaysCollection.insertOne(mongoWork);
      }
      console.log(`   ✅ Migrated ${mysqlWorkDays.length} work days`);
    }
    
    // Migrate Expenses
    console.log('\n5️⃣  Migrating Expenses...');
    let mysqlExpenses = [];
    try {
      // Try different possible table names
      try {
        [mysqlExpenses] = await mysqlConnection.execute('SELECT * FROM expenses ORDER BY expense_date DESC');
      } catch (e1) {
        [mysqlExpenses] = await mysqlConnection.execute('SELECT * FROM expense ORDER BY expense_date DESC');
      }
    } catch (error) {
      console.log(`   ⚠️  Expenses table not found: ${error.message}`);
      mysqlExpenses = [];
    }
    
    console.log(`   Found ${mysqlExpenses.length} expenses in MySQL`);
    
    if (mysqlExpenses.length > 0) {
      for (const mysqlExpense of mysqlExpenses) {
        const mongoExpense = {
          userId: userIdMap[mysqlExpense.user_id],
          type: mysqlExpense.type,
          category: mysqlExpense.category,
          description: mysqlExpense.description,
          amount: parseFloat(mysqlExpense.amount),
          expenseDate: new Date(mysqlExpense.expense_date),
          createdAt: mysqlExpense.created_at || new Date(),
          updatedAt: mysqlExpense.updated_at || new Date()
        };
        
        await expensesCollection.insertOne(mongoExpense);
      }
      console.log(`   ✅ Migrated ${mysqlExpenses.length} expenses`);
    }
    
    // Migrate Calendar Events
    console.log('\n6️⃣  Migrating Calendar Events...');
    try {
      const [mysqlEvents] = await mysqlConnection.execute('SELECT * FROM calendar_event ORDER BY start_date DESC');
      console.log(`   Found ${mysqlEvents.length} calendar events in MySQL`);
      
      if (mysqlEvents.length > 0) {
        for (const mysqlEvent of mysqlEvents) {
          const mongoEvent = {
            userId: userIdMap[mysqlEvent.user_id],
            title: mysqlEvent.title,
            description: mysqlEvent.description || '',
            eventType: mysqlEvent.event_type || 'work',
            startDate: new Date(mysqlEvent.start_date),
            endDate: mysqlEvent.end_date ? new Date(mysqlEvent.end_date) : new Date(mysqlEvent.start_date),
            startTime: mysqlEvent.start_time || null,
            endTime: mysqlEvent.end_time || null,
            isAllDay: mysqlEvent.is_all_day || false,
            priority: mysqlEvent.priority || 'normal',
            status: mysqlEvent.status || 'scheduled',
            reminderMinutes: mysqlEvent.reminder_minutes || null,
            location: mysqlEvent.location || '',
            attendees: mysqlEvent.attendees ? JSON.parse(mysqlEvent.attendees) : [],
            color: mysqlEvent.color || '#2563eb',
            course: mysqlEvent.course || null,
            createdAt: mysqlEvent.created_at || new Date(),
            updatedAt: mysqlEvent.updated_at || new Date()
          };
          
          await calendarEventsCollection.insertOne(mongoEvent);
        }
        console.log(`   ✅ Migrated ${mysqlEvents.length} calendar events`);
      }
    } catch (error) {
      console.log(`   ⚠️  Calendar events table not found or error: ${error.message}`);
    }
    
    // Migrate Goals
    console.log('\n7️⃣  Migrating Goals...');
    try {
      const [mysqlGoals] = await mysqlConnection.execute('SELECT * FROM goal ORDER BY deadline');
      console.log(`   Found ${mysqlGoals.length} goals in MySQL`);
      
      if (mysqlGoals.length > 0) {
        for (const mysqlGoal of mysqlGoals) {
          const mongoGoal = {
            userId: userIdMap[mysqlGoal.user_id],
            title: mysqlGoal.title,
            description: mysqlGoal.description || '',
            targetAmount: parseFloat(mysqlGoal.target_amount),
            currentAmount: parseFloat(mysqlGoal.current_amount) || 0,
            deadline: new Date(mysqlGoal.deadline),
            status: mysqlGoal.status || 'active',
            category: mysqlGoal.category || 'general',
            isShared: mysqlGoal.is_shared || false,
            createdAt: mysqlGoal.created_at || new Date(),
            updatedAt: mysqlGoal.updated_at || new Date()
          };
          
          await goalsCollection.insertOne(mongoGoal);
        }
        console.log(`   ✅ Migrated ${mysqlGoals.length} goals`);
      }
    } catch (error) {
      console.log(`   ⚠️  Goals table not found or error: ${error.message}`);
    }
    
    // Create Indexes
    console.log('\n8️⃣  Creating MongoDB Indexes...');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await workDaysCollection.createIndex({ userId: 1, workDate: -1 });
    await workDaysCollection.createIndex({ userId: 1, workDate: 1 }, { unique: true });
    await expensesCollection.createIndex({ userId: 1, expenseDate: -1 });
    await expensesCollection.createIndex({ userId: 1, type: 1 });
    await calendarEventsCollection.createIndex({ userId: 1, startDate: -1 });
    await goalsCollection.createIndex({ userId: 1, deadline: -1 });
    console.log('   ✅ Indexes created');
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`   • Users: ${mysqlUsers.length}`);
    console.log(`   • Work Days: ${mysqlWorkDays.length}`);
    console.log(`   • Expenses: ${mysqlExpenses.length}`);
    
    // Get counts from MongoDB to verify
    const mongoUserCount = await usersCollection.countDocuments();
    const mongoWorkCount = await workDaysCollection.countDocuments();
    const mongoExpenseCount = await expensesCollection.countDocuments();
    const mongoEventCount = await calendarEventsCollection.countDocuments();
    const mongoGoalCount = await goalsCollection.countDocuments();
    
    console.log('\nMongoDB Verification:');
    console.log(`   • Users: ${mongoUserCount}`);
    console.log(`   • Work Days: ${mongoWorkCount}`);
    console.log(`   • Expenses: ${mongoExpenseCount}`);
    console.log(`   • Calendar Events: ${mongoEventCount}`);
    console.log(`   • Goals: ${mongoGoalCount}`);
    
    console.log('\n' + '=' .repeat(60) + '\n');
    
    console.log('🎉 Your data is now in MongoDB Atlas!');
    console.log('💡 You can now start the backend server with: npm start');
    console.log('📝 Your MySQL data is still intact (not deleted)\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('MySQL connection closed');
    }
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run migration
migrateData();
