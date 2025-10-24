const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

class MongoDB {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      // Remove deprecated options - they're default in MongoDB driver v4+
      this.client = new MongoClient(uri);
      
      await this.client.connect();
      
      // Verify connection with a ping
      await this.client.db('admin').command({ ping: 1 });
      
      this.db = this.client.db('job_analytics');
      console.log('✅ Successfully connected to MongoDB Atlas');
      console.log('📊 Database: job_analytics');
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      
      if (error.message.includes('authentication failed')) {
        console.error('\n🔧 Authentication failed. Please check:');
        console.error('   1. Username and password in MONGODB_URI are correct');
        console.error('   2. Database user exists in MongoDB Atlas → Database Access');
        console.error('   3. IP address is whitelisted in Network Access (try 0.0.0.0/0)');
        console.error('   4. Password has no special characters OR is URL-encoded\n');
      }
      
      throw error;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('MongoDB connection closed');
    }
  }

  // Helper method to get a collection
  collection(name) {
    return this.getDb().collection(name);
  }
}

module.exports = new MongoDB();
