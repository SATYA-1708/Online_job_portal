const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { initSocket } = require('./socket');

dotenv.config();

// --- GLOBAL LOG REDIRECTOR (For cPanel/Production Debugging) ---
const serverLogFile = path.join(__dirname, 'server_logs.txt');
const stream = fs.createWriteStream(serverLogFile, { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;

const writeToLogFile = (type, args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg)).join(' ');
    stream.write(`[${timestamp}] [${type}] ${message}\n`);
};

console.log = (...args) => {
    writeToLogFile('INFO', args);
    originalLog.apply(console, args);
};

console.error = (...args) => {
    writeToLogFile('ERROR', args);
    originalError.apply(console, args);
};
// -------------------------------------------------------------

// --- STARTUP LOGGER ---
const logFile = path.join(__dirname, 'startup.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    originalLog(`[STARTUP] ${msg}`);
};
log("--- SERVER STARTING ---");

process.on('uncaughtException', (err) => {
    console.error(`CRITICAL UNCAUGHT EXCEPTION: ${err.stack}`);
    process.exit(1);
});
// ----------------------

const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
log(`Port identified: ${PORT}`);

const { connectDB } = require('./models/db');
log("Attempting to connect to DB...");
connectDB().then(() => log("DB Step finished (check models/db logs for success/fail)"));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://accounts.google.com"],
            "frame-src": ["'self'", "https://api.razorpay.com", "https://tds.razorpay.com", "https://accounts.google.com"],
            "connect-src": ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com", "https://*.razorpay.com"],
            "img-src": ["'self'", "data:", "https://*.razorpay.com"],
        },
    },
}));
log("Helmet middleware loaded");

app.set('trust proxy', 1); // Crucial for cPanel/Passenger to see real user IPs

// Global rate limiter: 2000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 2000 : 10000,
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 10000,
    message: { message: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(globalLimiter);
app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
}));
const { notFound, errorHandler, requestLogger } = require('./middleware/errorMiddleware');

app.use(requestLogger);
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api', (req, res) => {
    res.send('TECHSPARKX API is running');
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/verification', require('./routes/verificationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

log(`Resolving static paths...`);
const clientBuildPath = fs.existsSync(path.join(__dirname, '../client/dist'))
    ? path.join(__dirname, '../client/dist')
    : path.join(__dirname, 'client/dist');
log(`Static path resolved to: ${clientBuildPath}`);

app.use(express.static(clientBuildPath));

// Catch-all to serve React app for any other unknown routes
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handler middlewares
app.use(notFound);
app.use(errorHandler);

// Export the wrapped server instead of 'app' for socket.io mapping
// Passenger handling: Use the port provided by the environment
log(`Attempting to bind server...`);
server.listen(PORT, () => {
    log(`SUCCESS: Server is live and listening.`);
});
