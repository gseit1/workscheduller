require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function inspectWorkDays() {
    try {
        await client.connect();
        console.log('Connected to MongoDB\n');
        
        const db = client.db('job_analytics');
        
        // Get one work day document to see its exact structure
        const workDay = await db.collection('work_days').findOne({});
        
        console.log('📋 Raw Work Day Document Structure:');
        console.log(JSON.stringify(workDay, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

inspectWorkDays();
