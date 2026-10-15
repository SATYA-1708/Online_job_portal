const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const generateToken = (id) => {
    try {
        console.log(`Generating token for ID: ${id}`);
        console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`);
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
    } catch (err) {
        console.error('Error in generateToken:', err.message);
        throw err;
    }
};

const testLogin = async () => {
    try {
        const token = generateToken('65d6c8e39f3a2b0012345678');
        console.log('Generated Token:', token);
    } catch (err) {
        console.error('Test Failed:', err);
    }
};

testLogin();
