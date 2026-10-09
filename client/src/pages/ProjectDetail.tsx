import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';
import { openCreditCheckout } from '../utils/razorpayCheckout';
import { ReportModal } from '../components/ReportModal';
import { SEO } from '../components/SEO';

const CREDIT_PACKS = [
    { id: 'credits_5', label: '5 Credits', price: 49, popular: false },
    { id: 'credits_15', label: '15 Credits', price: 99, popular: true },
    { id: 'credits_30', label: '30 Credits', price: 179, popular: false },
];

const BuyCreditsModal = ({ onClose, onPurchased, token, userName, userEmail }: {
    onClose: () => void;
    onPurchased: (updatedUser: any) => void;
    token: string;
    userName: string;
    userEmail: string;
}) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const handleBuy = async (packId: string) => {
        setLoading(packId);
        await openCreditCheckout({
            packId,
            token,
            userName,
            userEmail,
            onSuccess: (updatedUser) => {
                setDone(true);
                setTimeout(() => onPurchased(updatedUser), 800);
            },
            onError: (msg) => alert(`❌ Payment failed: ${msg}`),
        });
        setLoading(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl" style={{ animation: 'fadeUp 0.3s ease-out' }}>
                <div className="p-6">
                    <button onClick={onClose} className="float-right text-gray-600 hover:text-white text-xl leading-none">×</button>
                    <div className="text-3xl mb-2">💳</div>
                    <h3 className="text-xl font-bold text-white mb-1">Buy Credits</h3>
                    <p className="text-gray-400 text-sm mb-5">1 credit is deducted from each party when an agreement is created. New users get 3 free credits.</p>

                    {done ? (
                        <div className="text-center py-4">
                            <div className="text-4xl mb-2">🎉</div>
                            <p className="text-emerald-400 font-bold">Credits added! Creating agreement...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {CREDIT_PACKS.map(pack => (
                                <button
                                    key={pack.id}
                                    onClick={() => handleBuy(pack.id)}
                                    disabled={loading !== null}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${pack.popular
                                        ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                        } disabled:opacity-50`}
                                >
                                    <div className="text-left">
                                        <span className="text-white font-bold text-sm">{pack.label}</span>
                                        {pack.popular && <span className="ml-2 text-[10px] font-bold text-emerald-400 uppercase">popular</span>}
                                    </div>
                                    <div className="text-right">
                                        {loading === pack.id
                                            ? <span className="text-gray-400 text-xs">Processing...</span>
                                            : <span className="text-emerald-400 font-bold">₹{pack.price}</span>
                                        }
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface Bid {
    userId: string;
    userName: string;
    amount: number;
    proposal: string;
    createdAt: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    budget: number;
    user: string;
    userName: string;
    createdAt: string;
    bids: Bid[];
    status?: string;
    awardedTo?: string;
    awardedToName?: string;
    contractId?: string;
}

interface MilestoneDraft { title: string; amount: string; }

export const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [bidAmount, setBidAmount] = useState('');
    const [proposal, setProposal] = useState('');
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(true);
    const [awarding, setAwarding] = useState<string | null>(null);
    const navigate = useNavigate();

    // Milestone modal
    const [milestoneModal, setMilestoneModal] = useState<Bid | null>(null);
    const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ title: '', amount: '' }]);

    // Credits modal
    const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
    const [pendingAward, setPendingAward] = useState(false); // retry after purchase

    // Report modal
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => { fetchProject(); }, [id]);

    const fetchProject = async () => {
        try {
            const headers: any = {};
            if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
            const response = await fetch(`${API_BASE}/projects/${id}`, { headers });
            const data = await response.json();
            if (response.ok) setProject(data);
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('Please login to bid');
        try {
            const response = await fetch(`${API_BASE}/projects/${id}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ amount: Number(bidAmount), proposal }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Bid placed!');
                setBidAmount('');
                setProposal('');
                fetchProject();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error placing bid:', error);
        }
    };

    const openMilestoneModal = (bid: Bid) => {
        setMilestoneModal(bid);
        setMilestones([{ title: 'Part 1', amount: String(bid.amount) }]);
    };

    const addMilestone = () => {
        setMilestones(prev => [...prev, { title: `Part ${prev.length + 1}`, amount: '' }]);
    };

    const removeMilestone = (idx: number) => {
        if (milestones.length <= 1) return;
        setMilestones(prev => prev.filter((_, i) => i !== idx));
    };

    const updateMilestone = (idx: number, field: 'title' | 'amount', value: string) => {
        setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    };

    const handleAwardWithMilestones = async () => {
        if (!user || !milestoneModal || !project) return;

        const validMilestones = milestones.filter(m => m.title.trim() && Number(m.amount) > 0);
        if (validMilestones.length === 0) return alert('Add at least one milestone with a title and amount.');

        const totalAmount = validMilestones.reduce((s, m) => s + Number(m.amount), 0);
        setAwarding(milestoneModal.userId);

        try {
            const res = await fetch(`${API_BASE}/contracts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({
                    projectId: project._id,
                    freelancerId: milestoneModal.userId,
                    freelancerName: milestoneModal.userName,
                    amount: totalAmount,
                    milestones: validMilestones.map(m => ({ title: m.title, amount: Number(m.amount) })),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMilestoneModal(null);
                fetchProject();
            } else if (res.status === 402 && data.needsCredits) {
                if (data.party === 'freelancer') {
                    alert(`⚠️ ${data.message}\n\nThe freelancer needs credits to enter this agreement. You can still buy your own credits for future agreements.`);
                } else {
                    // Employer needs credits — open buy modal
                    setPendingAward(true);
                    setBuyCreditsOpen(true);
                }
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error('Error awarding bid:', err);
        } finally {
            setAwarding(null);
        }
    };

    const handleCreditsPurchased = (updatedUser: any) => {
        login(updatedUser); // update stored user credits
        setBuyCreditsOpen(false);
        if (pendingAward) {
            setPendingAward(false);
            handleAwardWithMilestones(); // retry
        }
    };

    const handleMessageOwner = () => {
        if (!user) return alert('Please login to message');
        if (project) navigate(`/messages/${project.user}`);
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
    if (!project) return <div className="p-10 text-center text-red-400">Project not found</div>;

    const isOwner = user && user._id === project.user;
    const isAwarded = project.status === 'awarded';

    return (
        <div className="container mx-auto px-4 py-12">
            <SEO
                title={`${project.title} | Job on TECHSPARKX`}
                description={project.description.slice(0, 160)}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-2xl font-bold text-white leading-tight">{project.title}</h1>
                            <span className="text-2xl font-bold text-emerald-400 ml-4 whitespace-nowrap">₹{project.budget}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {project.userName.charAt(0)}
                                </div>
                                <span className="text-gray-300 font-medium">{project.userName}</span>
                                {(project as any).isOwnerAadhaarVerified && (
                                    <span className="flex items-center gap-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/20">
                                        ✓ Aadhaar
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-700">•</span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                            {isAwarded ? (
                                <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/20">Awarded</span>
                            ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20">Open</span>
                            )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description}</div>
                    </div>

                    {/* Agreement card (when awarded) */}
                    {isAwarded && project.contractId && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">📋</span>
                                <h3 className="text-lg font-bold text-white">Project Agreement Active</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                This project has been awarded to <span className="text-emerald-400 font-semibold">{project.awardedToName}</span>. Payments are made directly via UPI/QR.
                            </p>
                            <Link to="/contract" className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-all">
                                View Payments Dashboard →
                            </Link>
                        </div>
                    )}

                    {/* Bids */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            Proposals
                            <span className="bg-gray-800 text-gray-400 text-sm py-0.5 px-2 rounded-md">{project.bids.length}</span>
                        </h3>
                        {project.bids.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-gray-700 rounded-lg">
                                <p className="text-gray-500">No proposals yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {project.bids.map((bid, index) => {
                                    const isBidAwarded = isAwarded && project.awardedTo === bid.userId;
                                    return (
                                        <div key={index} className={`p-4 rounded-lg border transition-colors ${isBidAwarded ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">{bid.userName.charAt(0)}</div>
                                                    <span className="font-semibold text-white text-sm">{bid.userName}</span>
                                                    {isBidAwarded && (
                                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            ✓ AWARDED
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-emerald-400">₹{bid.amount}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{bid.proposal}</p>
                                            <div className="flex items-center gap-2 mt-3">
                                                {user && (
                                                    <button onClick={() => navigate(`/messages/${bid.userId}`)} className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors">
                                                        💬 Message
                                                    </button>
                                                )}
                                                {isOwner && !isAwarded && (
                                                    <button
                                                        onClick={() => openMilestoneModal(bid)}
                                                        className="ml-auto bg-emerald-500 text-gray-950 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 active:scale-95"
                                                    >
                                                        🏆 Award Bid
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {user && user._id !== project.user && (
                        <div className="card">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                            <button onClick={handleMessageOwner} className="btn-secondary w-full mb-3">
                                💬 Message {project.userName}
                            </button>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="w-full flex justify-center items-center gap-2 text-red-500/80 hover:text-red-400 text-xs font-bold py-2 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                Report Project
                            </button>
                        </div>
                    )}

                    {user && !isOwner && !isAwarded ? (
                        <div className="card lg:sticky lg:top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Place a Bid</h3>
                                <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2.5 py-1 rounded-full">
                                    💳 {(user as any).credits ?? 0} credits
                                </span>
                            </div>
                            {project.bids && project.bids.some(b => b.userId === user._id) ? (
                                <div className="text-center py-6 border border-dashed border-emerald-500/30 rounded-lg bg-emerald-500/5">
                                    <h4 className="text-emerald-400 font-bold mb-1">Proposal Submitted</h4>
                                    <p className="text-gray-500 text-sm">You have already placed a bid on this project.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleBidSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Bid Amount (₹)</label>
                                        <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="input-field" required placeholder="500" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm font-medium mb-2">Proposal</label>
                                        <textarea value={proposal} onChange={(e) => setProposal(e.target.value)} className="input-field h-32 resize-none" required placeholder="Why are you the best fit?" />
                                    </div>
                                    <p className="text-gray-600 text-xs">💡 Bidding is free. 1 credit is only used when both parties agree.</p>
                                    <button type="submit" className="btn-primary w-full py-3">Submit Proposal</button>
                                </form>
                            )}
                        </div>
                    ) : user && isAwarded ? (
                        <div className="card lg:sticky lg:top-24 text-center py-6">
                            <p className="text-gray-500">This project has been awarded.</p>
                            {project.awardedTo === user._id && (
                                <Link to="/contract" className="btn-primary mt-4 inline-block">View Payment</Link>
                            )}
                        </div>
                    ) : !user ? (
                        <div className="card text-center py-8">
                            <p className="text-gray-500 mb-4">Log in to bid or message.</p>
                            <Link to="/login" className="btn-primary w-full">Log In</Link>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Milestone Creation Modal */}
            {milestoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" style={{ animation: 'fadeUp 0.3s ease-out' }}>
                        <h3 className="text-xl font-bold text-white mb-1">Define Milestones</h3>
                        <p className="text-gray-500 text-sm mb-1">
                            Award to <span className="text-emerald-400 font-semibold">{milestoneModal.userName}</span>
                        </p>
                        <p className="text-gray-600 text-xs mb-6">
                            Split this project into parts. Payments are made directly via UPI/QR for each milestone.
                        </p>

                        <div className="space-y-3 mb-4">
                            {milestones.map((m, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={m.title}
                                        onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                        placeholder={`Part ${i + 1} title`}
                                        className="input-field flex-1 !py-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        value={m.amount}
                                        onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                                        placeholder="₹ Amount"
                                        className="input-field w-28 !py-2 text-sm"
                                    />
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-300 text-lg px-1">×</button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addMilestone} className="text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors mb-6 flex items-center gap-1">
                            + Add Milestone
                        </button>

                        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Amount:</span>
                                <span className="text-emerald-400 font-bold">
                                    ₹{milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-6">
                            <p className="text-amber-400/80 text-xs">
                                ⚠️ Payments are made directly between you and the freelancer via UPI/QR. We do not hold or process any payments. <Link to="/terms" className="underline">Read our Terms</Link>.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setMilestoneModal(null)} className="flex-1 btn-secondary !py-2.5 text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleAwardWithMilestones}
                                disabled={awarding === milestoneModal.userId}
                                className="flex-1 bg-emerald-500 text-gray-950 font-bold py-2.5 rounded-lg text-sm hover:bg-emerald-400 transition-all disabled:opacity-50"
                            >
                                {awarding === milestoneModal.userId ? 'Creating...' : '🏆 Award & Create Agreement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Buy Credits Modal */}
            {buyCreditsOpen && user && (
                <BuyCreditsModal
                    token={user.token}
                    userName={user.name}
                    userEmail={(user as any).email || ''}
                    onClose={() => { setBuyCreditsOpen(false); setPendingAward(false); }}
                    onPurchased={handleCreditsPurchased}
                />
            )}

            {/* Report Modal */}
            {project && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedId={project._id}
                    reportedType="project"
                />
            )}
        </div>
    );
};
