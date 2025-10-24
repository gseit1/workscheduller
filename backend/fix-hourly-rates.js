require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function fixHourlyRates() {
    try {
        await client.connect();
        console.log('Connected to MongoDB\n');
        
        const db = client.db('job_analytics');
        const usersCollection = db.collection('users');
        const workDaysCollection = db.collection('work_days');
        
        // Get all users
        const users = await usersCollection.find({}).toArray();
        
        console.log(`Found ${users.length} users\n`);
        
        for (const user of users) {
            console.log(`\n👤 Processing user: ${user.username}`);
            console.log(`   Default hourly rate: €${user.hourlyRate}`);
            
            // Check current work days for this user
            const userWorkDays = await workDaysCollection.find({ userId: user._id.toString() }).limit(3).toArray();
            console.log(`   Found ${userWorkDays.length} work days with userId as string`);
            if (userWorkDays.length > 0) {
                console.log(`   Sample: hourlyRate = ${userWorkDays[0].hourlyRate}, userId = ${userWorkDays[0].userId}`);
            }
            
            // Try with ObjectId
            const userWorkDaysObj = await workDaysCollection.find({ userId: user._id }).limit(3).toArray();
            console.log(`   Found ${userWorkDaysObj.length} work days with userId as ObjectId`);
            
            // Update all work days for this user to use their hourly rate (try both formats)
            const result1 = await workDaysCollection.updateMany(
                { 
                    userId: user._id.toString()
                },
                {
                    $set: { hourlyRate: user.hourlyRate }
                }
            );
            
            const result2 = await workDaysCollection.updateMany(
                { 
                    userId: user._id
                },
                {
                    $set: { hourlyRate: user.hourlyRate }
                }
            );
            
            console.log(`   ✅ Updated ${result1.modifiedCount} (string) + ${result2.modifiedCount} (ObjectId) = ${result1.modifiedCount + result2.modifiedCount} work days`);
        }
        
        console.log('\n\n📊 Verification:');
        
        // Check how many work days still have null hourly rate
        const nullRates = await workDaysCollection.countDocuments({ hourlyRate: null });
        console.log(`   Work days with null hourly rate: ${nullRates}`);
        
        // Show sample work day
        const sample = await workDaysCollection.findOne({});
        console.log('\n   Sample work day after fix:');
        console.log(`   - Hours: ${sample.hoursWorked}`);
        console.log(`   - Rate: €${sample.hourlyRate}`);
        console.log(`   - Earnings: €${(sample.hoursWorked * sample.hourlyRate).toFixed(2)}`);
        console.log(`   - Tips: €${sample.tipsAmount}`);
        console.log(`   - Total: €${(sample.hoursWorked * sample.hourlyRate + sample.tipsAmount).toFixed(2)}`);
        
        console.log('\n✅ Hourly rates fixed!\n');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixHourlyRates();
