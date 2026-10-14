const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ ERROR: MONGO_URI is not defined in your .env file.');
        process.exit(1);
    }

    console.log('🔍 Testing MongoDB Connection...');
    console.log(`📡 URI Source: ${uri.substring(0, 20)}...`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // 10 seconds
        });
        console.log('✅ SUCCESS: Connected to MongoDB successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ CONNECTION FAILED:');
        console.error('-------------------------------------------');
        console.error(`Error Name: ${error.name}`);
        console.error(`Error Message: ${error.message}`);

        if (error.message.includes('IP address') || error.message.includes('not authorized')) {
            console.error('\n💡 SUGGESTION: This looks like an IP Whitelist issue.');
            console.error('1. Log in to MongoDB Atlas.');
            console.error('2. Go to "Network Access".');
            console.error('3. Click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0) for testing.');
        } else if (error.message.includes('timeout')) {
            console.error('\n💡 SUGGESTION: The connection timed out.');
            console.error('1. Check if your internet connection is stable.');
            console.error('2. Ensure no firewall is blocking port 27017.');
        }

        console.error('-------------------------------------------');
        process.exit(1);
    }
};

testConnection();
