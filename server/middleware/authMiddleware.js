const jwt = require('jsonwebtoken');
const { users } = require('../models/db');

const protect = async (req, res, next) => {
    let token;

    const authHeader = req.get('Authorization');

    if (
        authHeader &&
        authHeader.startsWith('Bearer')
    ) {
        try {
            token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await users.findOne({ _id: decoded.id });

            if (req.user) {
                // Check badge expiration
                if (req.user.badge && req.user.badgeSubscriptionEnd) {
                    const now = new Date();
                    const end = new Date(req.user.badgeSubscriptionEnd);
                    if (now > end) {
                        // Expired
                        await users.update({ _id: req.user._id }, { $unset: { badge: true, badgeSubscriptionEnd: true } });
                        req.user.badge = undefined;
                        req.user.badgeSubscriptionEnd = undefined;
                    }
                }

                const plainUser = req.user.toObject ? req.user.toObject() : req.user;
                const { password, ...userWithoutPassword } = plainUser;
                req.user = userWithoutPassword;
                next();
            } else {
                res.status(401).json({ message: 'Not authorized, user not found' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }
};

module.exports = { protect, admin };
