require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;

async function checkData() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('job_analytics');
    
    console.log('\n📊 MongoDB Data Check\n');
    console.log('=' .repeat(60));
    
    // Check Users
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n👤 Users: ${usersCount}`);
    const users = await db.collection('users').find({}).toArray();
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Hourly Rate: €${user.hourlyRate}`);
    });
    
    // Check Work Days
    const workDaysCount = await db.collection('work_days').countDocuments();
    console.log(`\n📅 Work Days: ${workDaysCount}`);
    if (workDaysCount > 0) {
      const workDays = await db.collection('work_days').find({}).limit(5).sort({ workDate: -1 }).toArray();
      console.log('   Recent entries:');
      workDays.forEach(work => {
        const earnings = work.hoursWorked * work.hourlyRate;
        console.log(`   - ${work.workDate.toISOString().split('T')[0]}: ${work.hoursWorked}h @ €${work.hourlyRate} = €${earnings.toFixed(2)}`);
      });
      
      // Calculate total earnings this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const thisMonthWork = await db.collection('work_days').find({
        workDate: { $gte: startOfMonth, $lte: endOfMonth }
      }).toArray();
      
      console.log(`\n   📈 This Month (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}):`);
      console.log(`      Days worked: ${thisMonthWork.length}`);
      
      if (thisMonthWork.length > 0) {
        const totalHours = thisMonthWork.reduce((sum, day) => sum + day.hoursWorked, 0);
        const totalEarnings = thisMonthWork.reduce((sum, day) => sum + (day.hoursWorked * day.hourlyRate), 0);
        const totalTips = thisMonthWork.reduce((sum, day) => sum + (day.tipsAmount || 0), 0);
        
        console.log(`      Total hours: ${totalHours}`);
        console.log(`      Total earnings: €${totalEarnings.toFixed(2)}`);
        console.log(`      Total tips: €${totalTips.toFixed(2)}`);
        console.log(`      Grand total: €${(totalEarnings + totalTips).toFixed(2)}`);
      }
    }
    
    // Check Expenses
    const expensesCount = await db.collection('expenses').countDocuments();
    console.log(`\n💰 Expenses: ${expensesCount}`);
    if (expensesCount > 0) {
      const expenses = await db.collection('expenses').find({}).limit(5).sort({ expenseDate: -1 }).toArray();
      console.log('   Recent entries:');
      expenses.forEach(expense => {
        console.log(`   - ${expense.expenseDate.toISOString().split('T')[0]}: ${expense.description} - €${expense.amount} (${expense.type})`);
      });
    }
    
    // Check Calendar Events
    const eventsCount = await db.collection('calendar_events').countDocuments();
    console.log(`\n📆 Calendar Events: ${eventsCount}`);
    
    // Check Goals
    const goalsCount = await db.collection('goals').countDocuments();
    console.log(`\n🎯 Goals: ${goalsCount}`);
    
    console.log('\n' + '=' .repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkData();
