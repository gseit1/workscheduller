require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    const mysqlConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Checking MySQL work_days schema...\n');
    
    // Check work_days columns
    const [columns] = await mysqlConnection.execute(`
        SHOW COLUMNS FROM work_days
    `);
    
    console.log('work_days columns:');
    columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if hourly_rate_history exists
    console.log('\n\nChecking for hourly_rate_history table...');
    try {
        const [rateHistory] = await mysqlConnection.execute(`
            SELECT * FROM hourly_rate_history LIMIT 5
        `);
        console.log(`Found ${rateHistory.length} rate history records`);
        if (rateHistory.length > 0) {
            console.log('Sample:');
            console.log(rateHistory[0]);
        }
    } catch (error) {
        console.log('❌ Table does not exist');
    }
    
    // Sample work day
    console.log('\n\nSample work_days record:');
    const [sampleWork] = await mysqlConnection.execute(`
        SELECT * FROM work_days LIMIT 1
    `);
    if (sampleWork.length > 0) {
        console.log(sampleWork[0]);
    }
    
    await mysqlConnection.end();
}

checkSchema();
