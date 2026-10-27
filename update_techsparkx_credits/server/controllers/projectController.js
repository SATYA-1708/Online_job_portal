const { projects } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');
const fs = require('fs');
const path = require('path');

// Re-use the log function from index.js if possible, or define a local one
const log = (msg) => {
    const logFile = path.join(__dirname, '../startup.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] [PROJECT] ${msg}\n`);
    console.log(`[PROJECT] ${msg}`);
};
const jwt = require('jsonwebtoken');
const { pushNotification } = require('../utils/notificationPusher');


const createProject = async (req, res) => {
    try {
        const { title, description, budget } = req.body;

        if (!title || !description || !budget) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const numBudget = Number(budget);
        if (isNaN(numBudget) || numBudget <= 0) {
            return res.status(400).json({ message: 'Budget must be a valid positive number' });
        }

        const { users } = require('../models/db');
        const user = await users.findOne({ _id: req.user._id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Deductions removed: Posting is now free. Credits deducted only at contract stage.

        const project = await projects.create({
            user: req.user._id,
            userName: req.user.name,
            userBadge: req.user.badge,
            title,
            description,
            budget: numBudget,
            bids: [],
            createdAt: new Date(),
        });

        await logActivity(req.user._id, req.user.name, req.user.role, 'posted_project', `Posted a new job: ${title}`, project._id);

        log(`Project created successfully: ${project._id} by ${req.user.name}`);
        res.status(201).json(project);
    } catch (err) {
        log(`ERROR creating project: ${err.message}`);
        res.status(500).json({ message: 'Server error while creating project' });
    }
};

const getProjects = async (req, res) => {
    try {
        // Reduced timeout for local dev responsiveness
        const allProjects = await projects.find({ status: { $ne: 'awarded' } }).sort({ createdAt: -1 });

        // [SECURITY] Redact proposals/bids for public viewers to prevent scraping
        const redactedProjects = allProjects.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            const { bids, ...rest } = pObj;
            return {
                ...rest,
                bidCount: bids ? bids.length : 0,
                bids: [] // Send empty array to not break frontend expecting it
            };
        });

        log(`Found ${allProjects.length} projects. Redacting for public view...`);
        res.status(200).json(redactedProjects);
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[PROD] Database error during getProjects:', err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        console.log('[DEV] Database timeout/error, returning mock projects');
        res.status(200).json([
            {
                _id: 'mock_proj_1',
                title: 'Build a Modern Portfolio Website',
                description: 'We need a stunning portfolio website with React and Framer Motion. High-end design required.',
                budget: 15000,
                userName: 'Design Studio',
                userBadge: 'Pro',
                createdAt: new Date().toISOString(),
                status: 'open',
                bidCount: 5
            },
            {
                _id: 'mock_proj_2',
                title: 'Fix MongoDB Connection Issues',
                description: 'Need an expert to help with a blocking MongoDB Atlas connection timeout issue.',
                budget: 5000,
                userName: 'Startup Founder',
                userBadge: 'None',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                status: 'open',
                bidCount: 2
            }
        ]);
    }
};

const getProjectById = async (req, res) => {
    const project = await projects.findOne({ _id: req.params.id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let isOwner = false;
    let userId = null;
    let authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
            if (userId === project.user.toString()) {
                isOwner = true;
            }
        } catch (e) {
            // Ignore invalid token
        }
    }

    const { users } = require('../models/db');
    const owner = await users.findById(project.user).select('isAadhaarVerified');

    const projectObj = project.toObject ? project.toObject() : project;
    const { bids, ...rest } = projectObj;

    let safeBids = [];
    if (isOwner) {
        safeBids = bids || [];
    } else if (userId && bids) {
        // Send only the user's own bid so the frontend knows they bid
        safeBids = bids.filter(b => b.userId && b.userId.toString() === userId);
    }

    const safeProject = {
        ...rest,
        isOwnerAadhaarVerified: owner ? owner.isAadhaarVerified : false,
        bidCount: bids ? bids.length : 0,
        bids: safeBids
    };

    res.status(200).json(safeProject);
};

const placeBid = async (req, res) => {
    const { amount, proposal } = req.body;
    const projectId = req.params.id;

    if (!amount || !proposal) {
        return res.status(400).json({ message: 'Please add amount and proposal' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Bid amount must be a valid positive number' });
    }

    const project = await projects.findOne({ _id: projectId });

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status === 'awarded') {
        return res.status(400).json({ message: 'This project has already been awarded and is closed to new bids' });
    }

    const { users } = require('../models/db');
    const user = await users.findOne({ _id: req.user._id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Deductions removed: Bidding is now free. Credits deducted only at contract stage.

    // Prevent project owner from bidding on their own project
    if (project.user.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot bid on your own project' });
    }

    // Prevent submitting multiple bids on the same project
    const existingBid = project.bids.find(b => b.userId && b.userId.toString() === req.user._id.toString());
    if (existingBid) {
        return res.status(400).json({ message: 'You have already submitted a bid for this project' });
    }

    const bid = {
        userId: req.user._id,
        userName: req.user.name,
        amount: numAmount,
        proposal,
        createdAt: new Date(),
    };

    const updateProjectResult = await projects.updateOne(
        { _id: projectId, status: { $ne: 'awarded' }, "bids.userId": { $ne: req.user._id } },
        { $push: { bids: bid } }
    );

    if (updateProjectResult.modifiedCount === 0) {
        return res.status(400).json({ message: 'Could not place bid. The project may be awarded or you have already bid.' });
    }

    // Send notification to project owner
    await pushNotification(
        project.user,
        'info',
        'New Bid Received',
        `${req.user.name} placed a ₹${numAmount} bid on "${project.title}".`,
        `/projects/${projectId}`
    );

    res.status(200).json(bid);
};

const getMyProjectBids = async (req, res) => {
    const project = await projects.findOne({ _id: req.params.id });

    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view bids for this project' });
    }

    res.status(200).json(project.bids || []);
};

/**
 * GET /api/projects/my
 * Returns projects where the user is the owner OR the awarded freelancer
 */
const getMyProjects = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const userOid = req.user._id;

        // Find projects where user is the owner OR awardedTo matches
        // Explicitly check for both ObjectId and String versions to be safe
        const userProjects = await projects.find({
            $or: [
                { user: userOid },
                { user: userId },
                { awardedTo: userOid },
                { awardedTo: userId }
            ]
        }).sort({ createdAt: -1 }).lean();

        log(`getMyProjects: Found ${userProjects.length} projects for user ${userId}`);
        res.status(200).json(userProjects);
    } catch (err) {
        log(`ERROR in getMyProjects: ${err.message}`);
        res.status(500).json({ message: 'Server error while fetching your projects' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    placeBid,
    getMyProjectBids,
    getMyProjects
};
