const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { contracts, projects, users, referrals, settings } = require('../models/db');
const { logActivity } = require('../utils/activityLogger');
const { pushNotification } = require('../utils/notificationPusher');


// Multer config for payment proof images
const proofsDir = path.join(__dirname, '../uploads/proofs');
if (!fs.existsSync(proofsDir)) fs.mkdirSync(proofsDir, { recursive: true });

const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, proofsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const proofUpload = multer({
    storage: proofStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = /image|pdf/.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image or PDF files allowed'));
    },
});

/**
 * POST /api/contracts
 * Employer awards a bid → creates a project agreement with milestones.
 */
const createContract = async (req, res) => {
    const { projectId, freelancerId, freelancerName, amount, milestones } = req.body;

    if (!projectId || !freelancerId || !freelancerName || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ message: 'Contract amount must be a positive number' });
    }

    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
        return res.status(400).json({ message: 'At least one milestone is required' });
    }

    // Prevent self-awarding trap
    if (freelancerId.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot award a contract agreement to yourself' });
    }

    const project = await projects.findOne({ _id: projectId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the project owner can award a bid' });
    }
    if (project.status === 'awarded') {
        return res.status(400).json({ message: 'Project already awarded' });
    }

    // Prevent Silent Contract Kidnapping / Credit Siphoning
    const hasBid = project.bids && project.bids.some(b => b.userId && b.userId.toString() === freelancerId.toString());
    if (!hasBid) {
        return res.status(400).json({ message: 'This freelancer has not formally placed a bid on your project' });
    }

    let validMilestones = true;
    const formattedMilestones = milestones.map((m, i) => {
        const mAmount = Number(m.amount);
        if (isNaN(mAmount) || mAmount <= 0) validMilestones = false;

        return {
            index: i,
            title: m.title || `Part ${i + 1}`,
            amount: mAmount,
            status: 'pending',
            taskDoneByEmployer: false,
            taskDoneByFreelancer: false,
            taskConfirmed: false,
            paidNote: '',
            proofImage: null,
            paidAt: null,
            confirmedAt: null,
        };
    });

    if (!validMilestones) {
        return res.status(400).json({ message: 'All milestone amounts must be valid positive numbers' });
    }

    // TOCTOU Fix: Atomically check and deduct credits from both parties
    const empResult = await users.updateOne({ _id: req.user._id, credits: { $gt: 0 } }, { $inc: { credits: -1 } });
    if (empResult.modifiedCount === 0) {
        return res.status(402).json({ needsCredits: true, party: 'employer', message: 'You need at least 1 credit to create an agreement.' });
    }

    const freeResult = await users.updateOne({ _id: freelancerId, credits: { $gt: 0 } }, { $inc: { credits: -1 } });
    if (freeResult.modifiedCount === 0) {
        // Rollback employer if freelancer lacks credits
        await users.updateOne({ _id: req.user._id }, { $inc: { credits: 1 } });
        return res.status(402).json({ needsCredits: true, party: 'freelancer', freelancerName, message: `${freelancerName} does not have enough credits to enter this agreement.` });
    }

    const contract = await contracts.create({
        projectId,
        projectTitle: project.title,
        employerId: req.user._id,
        employerName: req.user.name,
        freelancerId,
        freelancerName,
        amount: numAmount,
        milestones: formattedMilestones,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await projects.updateOne(
        { _id: projectId },
        { $set: { status: 'awarded', awardedTo: freelancerId, awardedToName: freelancerName, contractId: contract._id } }
    );

    // Both parties are "involved", but the employer is the one taking the action.
    await logActivity(req.user._id, req.user.name, req.user.role, 'awarded_contract', `Awarded contract to ${freelancerName} for project: ${project.title}`, contract._id);

    // Notify Freelancer
    await pushNotification(
        freelancerId,
        'success',
        'Contract Awarded',
        `Congratulations! ${req.user.name} has awarded you the contract for "${project.title}".`,
        '/contract'
    );

    res.status(201).json(contract);
};

/**
 * GET /api/contracts
 * Returns all agreements where the logged-in user is employer OR freelancer.
 */
const getMyContracts = async (req, res) => {
    const userId = req.user._id;
    const myContracts = await contracts.find({
        $or: [{ employerId: userId }, { freelancerId: userId }]
    }).sort({ updatedAt: -1 });
    res.status(200).json(myContracts);
};

/**
 * GET /api/contracts/:id
 */
const getContractById = async (req, res) => {
    const contract = await contracts.findOne({ _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Agreement not found' });
    if (contract.employerId.toString() !== req.user._id.toString() && contract.freelancerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this agreement' });
    }
    res.status(200).json(contract);
};

/**
 * PATCH /api/contracts/:id/milestone/:milestoneIndex/task-done
 * Either party marks the task as completed on their end.
 * When BOTH confirm → taskConfirmed = true → client can pay.
 */
const confirmTaskDone = async (req, res) => {
    const { id, milestoneIndex } = req.params;
    const mIdx = Number(milestoneIndex);

    const contract = await contracts.findOne({ _id: id });
    if (!contract) return res.status(404).json({ message: 'Agreement not found' });

    if (contract.employerId.toString() !== req.user._id.toString() && contract.freelancerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    if (contract.status !== 'active') {
        return res.status(400).json({ message: `Cannot modify a milestone while the agreement is ${contract.status}` });
    }
    if (!contract.milestones || mIdx < 0 || mIdx >= contract.milestones.length) {
        return res.status(400).json({ message: 'Invalid milestone index' });
    }

    const milestone = { ...contract.milestones[mIdx] };

    if (milestone.status !== 'pending') {
        return res.status(400).json({ message: `Cannot confirm task on a milestone that is already ${milestone.status}` });
    }

    const updateField = contract.employerId.toString() === req.user._id.toString() ? `milestones.${mIdx}.taskDoneByEmployer` : `milestones.${mIdx}.taskDoneByFreelancer`;

    // Data Race Fix: Atomically set the specific user's confirmation flag
    await contracts.updateOne(
        { _id: id },
        { $set: { [updateField]: true, updatedAt: new Date() } }
    );

    // Re-fetch to atomically check the state combined
    const updatedContract = await contracts.findOne({ _id: id });
    const updatedMilestone = updatedContract.milestones[mIdx];

    if (updatedMilestone.taskDoneByEmployer && updatedMilestone.taskDoneByFreelancer && !updatedMilestone.taskConfirmed) {
        await contracts.updateOne(
            { _id: id, [`milestones.${mIdx}.taskConfirmed`]: false },
            { $set: { [`milestones.${mIdx}.taskConfirmed`]: true } }
        );
    }

    const finalContract = await contracts.findOne({ _id: id });

    // Notify the other party
    const targetUserId = req.user._id.toString() === finalContract.employerId.toString() ? finalContract.freelancerId : finalContract.employerId;
    await pushNotification(
        targetUserId,
        'info',
        'Milestone Task Update',
        `${req.user.name} has marked their task as done for milestone "${milestone.title}".`,
        '/contract'
    );

    res.status(200).json(finalContract);
};

/**
 * PATCH /api/contracts/:id/milestone/:milestoneIndex/paid
 * Client marks a milestone as paid. Accepts multipart/form-data with optional proof image.
 * Fields: note (text), proofImage (file)
 */
const markMilestonePaid = async (req, res) => {
    const { id, milestoneIndex } = req.params;
    const mIdx = Number(milestoneIndex);

    const contract = await contracts.findOne({ _id: id });
    if (!contract) return res.status(404).json({ message: 'Agreement not found' });

    if (contract.employerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the client can mark payment as sent' });
    }
    if (contract.status !== 'active') {
        return res.status(400).json({ message: `Cannot modify a milestone while the agreement is ${contract.status}` });
    }
    if (!contract.milestones || mIdx < 0 || mIdx >= contract.milestones.length) {
        return res.status(400).json({ message: 'Invalid milestone index' });
    }

    const milestone = contract.milestones[mIdx];
    if (milestone.status !== 'pending') {
        return res.status(400).json({ message: `Milestone already ${milestone.status}` });
    }
    if (!milestone.taskConfirmed) {
        return res.status(400).json({ message: 'Both parties must confirm task completion before payment' });
    }

    const proofImageUrl = req.file ? `/uploads/proofs/${req.file.filename}` : null;

    // Data Race Fix: Use atomic $set on the specific milestone array index
    await contracts.updateOne(
        { _id: id },
        {
            $set: {
                [`milestones.${mIdx}.status`]: 'paid',
                [`milestones.${mIdx}.paidNote`]: req.body.note || '',
                [`milestones.${mIdx}.proofImage`]: proofImageUrl,
                [`milestones.${mIdx}.paidAt`]: new Date(),
                updatedAt: new Date()
            }
        }
    );

    const updatedContract = await contracts.findOne({ _id: id });

    // Notify the freelancer that money is sent
    await pushNotification(
        contract.freelancerId,
        'success',
        'Payment Sent',
        `${req.user.name} has sent the payment for milestone "${milestone.title}". Please confirm receipt.`,
        '/contract'
    );

    res.status(200).json(updatedContract);
};

/**
 * PATCH /api/contracts/:id/milestone/:milestoneIndex/confirm
 * Freelancer confirms they received payment for this milestone.
 */
const confirmMilestoneReceived = async (req, res) => {
    const { id, milestoneIndex } = req.params;
    const mIdx = Number(milestoneIndex);

    const contract = await contracts.findOne({ _id: id });
    if (!contract) return res.status(404).json({ message: 'Agreement not found' });

    if (contract.freelancerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the freelancer can confirm receipt' });
    }
    if (contract.status !== 'active') {
        return res.status(400).json({ message: `Cannot modify a milestone while the agreement is ${contract.status}` });
    }
    if (!contract.milestones || mIdx < 0 || mIdx >= contract.milestones.length) {
        return res.status(400).json({ message: 'Invalid milestone index' });
    }

    const milestone = contract.milestones[mIdx];
    if (milestone.status !== 'paid') {
        return res.status(400).json({ message: 'Client has not marked this milestone as paid yet' });
    }

    // Data Race Fix: Atomic update
    await contracts.updateOne(
        { _id: id },
        {
            $set: {
                [`milestones.${mIdx}.status`]: 'confirmed',
                [`milestones.${mIdx}.confirmedAt`]: new Date(),
                updatedAt: new Date()
            }
        }
    );

    const updatedContract = await contracts.findOne({ _id: id });

    await logActivity(req.user._id, req.user.name, req.user.role, 'milestone_confirmed', `Confirmed payment received for milestone ${milestoneIndex}`, contract._id);

    // Notify Employer
    await pushNotification(
        contract.employerId,
        'success',
        'Payment Confirmed',
        `${req.user.name} confirmed receiving payment for milestone "${milestone.title}".`,
        '/contract'
    );

    // If all milestones confirmed → agreement completed
    const allConfirmed = updatedContract.milestones.every(m => m.status === 'confirmed');
    if (allConfirmed) {
        // [SECURITY] Atomic state transition to prevent double rewards if multiple milestones confirm at once
        const updateResult = await contracts.updateOne({ _id: id, status: { $ne: 'completed' } }, { $set: { status: 'completed' } });

        if (updateResult.modifiedCount > 0) {
            updatedContract.status = 'completed';

            // Notify both parties of completion
            await pushNotification(
                contract.employerId,
                'success',
                'Contract Completed',
                `All milestones for "${contract.projectTitle}" are complete! You can now leave a review.`,
                '/contract'
            );
            await pushNotification(
                contract.freelancerId,
                'success',
                'Contract Completed',
                `All milestones for "${contract.projectTitle}" are complete! You can now leave a review.`,
                '/contract'
            );

            // Referral reward logic
            try {
                const freelancer = await users.findOne({ _id: updatedContract.freelancerId });
                if (freelancer && freelancer.referredByUserId) {
                    const previousCompleted = await contracts.find({
                        freelancerId: freelancer._id,
                        status: 'completed',
                        _id: { $ne: updatedContract._id }
                    });
                    if (previousCompleted.length === 0) {
                        const referral = await referrals.findOne({
                            referrerId: freelancer.referredByUserId,
                            referredUserId: freelancer._id,
                            status: 'pending'
                        });
                        if (referral) {
                            await referrals.updateOne(
                                { _id: referral._id },
                                { $set: { status: 'rewarded', rewardType: 'credit', rewardedAt: new Date() } }
                            );
                            const siteSettings = await settings.findOne() || {};
                            const bonus = siteSettings.referralBonusCredits !== undefined ? siteSettings.referralBonusCredits : 1;
                            await users.updateOne({ _id: freelancer.referredByUserId }, { $inc: { referralCredits: bonus } });
                            await users.updateOne({ _id: freelancer._id }, { $inc: { referralCredits: bonus } });
                        }
                    }
                }
            } catch (refErr) {
                console.error('Referral reward error:', refErr);
            }
        }
    }

    res.status(200).json(updatedContract);
};

/**
 * PATCH /api/contracts/:id/dispute
 * Either party can raise a dispute.
 */
const raiseDispute = async (req, res) => {
    const contract = await contracts.findOne({ _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Agreement not found' });

    if (contract.employerId.toString() !== req.user._id.toString() && contract.freelancerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    if (contract.status === 'completed' || contract.status === 'disputed') {
        return res.status(400).json({ message: `Cannot dispute an agreement that is already ${contract.status}` });
    }

    // Fixed race condition causing data clobbering when disputing concurrently with milestone updates
    const updateResult = await contracts.updateOne(
        { _id: contract._id, status: { $nin: ['completed', 'disputed'] } },
        { $set: { status: 'disputed', updatedAt: new Date() } }
    );

    if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ message: 'Agreement state changed before dispute could be raised.' });
    }

    contract.status = 'disputed';
    res.status(200).json(contract);
};

module.exports = {
    createContract,
    getMyContracts,
    getContractById,
    confirmTaskDone,
    markMilestonePaid,
    confirmMilestoneReceived,
    raiseDispute,
    proofUpload,
};
