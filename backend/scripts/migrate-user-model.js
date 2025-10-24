require('dotenv').config();
const mongodb = require('../config/mongodb');
const UserModel = require('../models/User');

async function migrateUserModel() {
  try {
    console.log('\n🔄 Starting User Model Migration\n');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    console.log('\n1️⃣  Connecting to MongoDB...');
    await mongodb.connect();
    const db = mongodb.getDb();
    console.log('   ✅ MongoDB connected');
    
    // Initialize User Model
    console.log('\n2️⃣  Initializing User Model...');
    const userModel = new UserModel(db);
    console.log('   ✅ User Model initialized');
    
    // Create indexes
    console.log('\n3️⃣  Creating indexes...');
    await userModel.createIndexes();
    console.log('   ✅ Indexes created:');
    console.log('      - email (unique)');
    console.log('      - username (unique)');
    
    // Get existing indexes to verify
    console.log('\n4️⃣  Verifying indexes...');
    const indexes = await userModel.collection.indexes();
    console.log('   ✅ Current indexes on users collection:');
    indexes.forEach(index => {
      console.log(`      - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Count existing users
    console.log('\n5️⃣  Checking existing users...');
    const userCount = await userModel.collection.countDocuments();
    console.log(`   ✅ Found ${userCount} users in database`);
    
    // Check user schema compliance
    if (userCount > 0) {
      console.log('\n6️⃣  Checking user schema compliance...');
      const sampleUser = await userModel.collection.findOne({});
      const expectedFields = ['username', 'email', 'password', 'hourlyRate', 'currency', 'avatar', 'createdAt', 'updatedAt'];
      const missingFields = expectedFields.filter(field => !(field in sampleUser));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Some users may be missing fields: ${missingFields.join(', ')}`);
        console.log('   📝 Consider running an update to add missing fields...');
        
        // Optional: Add missing fields to all users
        const updates = {};
        if (missingFields.includes('avatar')) updates.avatar = null;
        if (missingFields.includes('currency')) updates.currency = 'EUR';
        if (missingFields.includes('hourlyRate')) updates.hourlyRate = 15;
        if (missingFields.includes('updatedAt')) updates.updatedAt = new Date();
        
        if (Object.keys(updates).length > 0) {
          console.log('   🔧 Adding missing fields to users...');
          const result = await userModel.collection.updateMany(
            {},
            { $set: updates }
          );
          console.log(`   ✅ Updated ${result.modifiedCount} users`);
        }
      } else {
        console.log('   ✅ All users have required fields');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ User Model Migration Completed Successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUserModel();
