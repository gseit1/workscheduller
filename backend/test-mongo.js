const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...\n');
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Make sure you have a .env file with MONGODB_URI set');
    process.exit(1);
  }
  
  console.log('📡 Connection string:', uri.replace(/:[^:@]+@/, ':****@'));
  
  const client = new MongoClient(uri);
  
  try {
    console.log('\n⏳ Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    const db = client.db('job_analytics');
    console.log('\n📊 Database: job_analytics');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections (${collections.length}):`);
    if (collections.length === 0) {
      console.log('   (No collections yet - they will be created when you use the app)');
    } else {
      collections.forEach(coll => {
        console.log(`   - ${coll.name}`);
      });
    }
    
    // Test a simple operation
    console.log('\n🧪 Testing write operation...');
    const testCollection = db.collection('_connection_test');
    await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Write operation successful');
    
    // Clean up test
    await testCollection.deleteMany({ test: true });
    console.log('🧹 Test data cleaned up');
    
    console.log('\n✨ All tests passed! Your MongoDB Atlas is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. The app will create collections automatically');
    console.log('   3. Register a user to start using the app');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your MONGODB_URI in .env file');
    console.log('   2. Verify your MongoDB Atlas username and password');
    console.log('   3. Make sure IP whitelist allows your IP (or 0.0.0.0/0 for all)');
    console.log('   4. Check if cluster is running in MongoDB Atlas dashboard');
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

testConnection();
