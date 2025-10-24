require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  console.log('\n🔍 MongoDB Connection Diagnostic Tool\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check if URI exists
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
  }
  
  // Step 2: Show masked URI
  const maskedUri = uri.replace(/:[^:@]+@/, ':****@');
  console.log('📡 Connection URI:', maskedUri);
  
  // Step 3: Parse URI details
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://'));
    console.log('👤 Username:', url.username || 'NOT_FOUND');
    console.log('🔒 Password:', url.password ? '****' + url.password.slice(-2) : 'NOT_FOUND');
    console.log('🌐 Host:', url.hostname);
    console.log('💾 Database:', uri.split('/').pop().split('?')[0]);
  } catch (e) {
    console.error('⚠️  Could not parse URI:', e.message);
  }
  
  console.log('=' .repeat(60));
  
  // Step 4: Test different connection scenarios
  console.log('\n🧪 Testing connection scenarios...\n');
  
  const client = new MongoClient(uri);
  
  try {
    console.log('1️⃣  Attempting to connect...');
    await client.connect();
    console.log('   ✅ Connected successfully');
    
    console.log('\n2️⃣  Testing admin ping...');
    await client.db('admin').command({ ping: 1 });
    console.log('   ✅ Ping successful');
    
    console.log('\n3️⃣  Listing databases...');
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('   ✅ Found', dbs.databases.length, 'databases:');
    dbs.databases.forEach(db => {
      console.log('      -', db.name);
    });
    
    console.log('\n4️⃣  Testing job_analytics database...');
    const db = client.db('job_analytics');
    const collections = await db.listCollections().toArray();
    console.log('   ✅ Database accessible');
    console.log('   📦 Collections:', collections.length);
    
    if (collections.length > 0) {
      console.log('      Existing collections:');
      collections.forEach(col => {
        console.log('      -', col.name);
      });
    } else {
      console.log('      (No collections yet - will be created automatically)');
    }
    
    console.log('\n5️⃣  Testing write permission...');
    const testCol = db.collection('_connection_test');
    await testCol.insertOne({ test: true, timestamp: new Date() });
    console.log('   ✅ Write successful');
    
    await testCol.deleteOne({ test: true });
    console.log('   ✅ Delete successful');
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ ALL TESTS PASSED! MongoDB is ready to use.');
    console.log('=' .repeat(60) + '\n');
    
  } catch (error) {
    console.log('\n' + '=' .repeat(60));
    console.error('❌ CONNECTION FAILED\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code || 'N/A');
    console.error('Name:', error.name || 'N/A');
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:\n');
    
    if (error.message.includes('authentication failed') || error.code === 8000) {
      console.log('🔐 Authentication Issue Detected');
      console.log('   → The username or password is incorrect\n');
      console.log('   Fix options:');
      console.log('   1. Go to MongoDB Atlas → Database Access');
      console.log('   2. Verify user "giorgosseitar" exists');
      console.log('   3. Click "Edit" and reset the password');
      console.log('   4. Use a simple password without special characters');
      console.log('   5. Update .env file with new password\n');
      console.log('   OR');
      console.log('   1. Create NEW database user:');
      console.log('      Username: jobanalytics');
      console.log('      Password: JobAnalytics123');
      console.log('   2. Give "Atlas admin" or "Read and write to any database" role');
      console.log('   3. Update .env:');
      console.log('      MONGODB_URI=mongodb+srv://jobanalytics:JobAnalytics123@cluster0.h2jp4ey.mongodb.net/job_analytics?retryWrites=true&w=majority');
      
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🌐 Network/DNS Issue');
      console.log('   → Cannot resolve cluster hostname');
      console.log('   → Check internet connection');
      
    } else if (error.message.includes('IP') || error.message.includes('not authorized')) {
      console.log('🔒 IP Whitelist Issue');
      console.log('   → Your IP is not whitelisted');
      console.log('   → Go to MongoDB Atlas → Network Access');
      console.log('   → Add IP Address: 0.0.0.0/0 (allows all IPs)');
      
    } else {
      console.log('❓ Unknown Error');
      console.log('   → Check MongoDB Atlas dashboard');
      console.log('   → Verify cluster is running');
      console.log('   → Check cluster connection string format');
    }
    
    console.log('\n' + '=' .repeat(60) + '\n');
    process.exit(1);
    
  } finally {
    await client.close();
  }
}

testConnection();
