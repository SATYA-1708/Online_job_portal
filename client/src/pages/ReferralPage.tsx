import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';

interface ReferralRecord {
    _id: string;
    referredUserName: string;
    status: 'pending' | 'rewarded';
    createdAt: string;
}

interface ReferralData {
    referralCode: string;
    referralCredits: number;
    freePostings: number;
    freeBids: number;
    totalRewarded: number;
    referrals: ReferralRecord[];
}

export const ReferralPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        if (user?.token) fetchReferralInfo();
    }, [user]);

    const fetchReferralInfo = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/referral-info`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            if (res.ok) setData(await res.json());
        } catch (err) {
            console.error('Failed to fetch referral info:', err);
        } finally {
            setLoading(false);
        }
    };

    const claimCredit = async (type: 'posting' | 'bid') => {
        if (!user || claiming) return;
        setClaiming(true);
        try {
            const res = await fetch(`${API_BASE}/auth/claim-referral-credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
                body: JSON.stringify({ type }),
            });
            const json = await res.json();
            if (res.ok) {
                alert(json.message);
                fetchReferralInfo();
            } else {
                alert(json.message);
            }
        } catch (err) {
            console.error('Error claiming credit:', err);
        } finally {
            setClaiming(false);
        }
    };

    const referralLink = data ? `${window.location.origin}/register?ref=${data.referralCode}` : '';

    const copyCode = () => {
        if (!data) return;
        navigator.clipboard.writeText(data.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    // Values not rendered in current view


    return (
        <div className="min-h-[calc(100vh-64px)] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-20 left-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 pt-10 pb-20 relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-12" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Referral Program
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Invite Friends, <span className="text-gradient">Earn Free Credits</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                        Share your referral code. When your friend completes their first project, <strong className="text-emerald-400">both of you</strong> earn a free credit — use it to post a project or place a bid!
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" style={{ animation: 'fadeUp 0.6s ease-out 0.1s both' }}>
                    <div className="card text-center group">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <span className="text-xl">🎟️</span>
                        </div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Available Credits</p>
                        <p className="text-3xl font-black text-emerald-400">{data?.referralCredits || 0}</p>
                    </div>
                    <div className="card text-center group">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <span className="text-xl">📋</span>
                        </div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Free Postings</p>
                        <p className="text-3xl font-black text-blue-400">{data?.freePostings || 0}</p>
                    </div>
                    <div className="card text-center group">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                            <span className="text-xl">🎯</span>
                        </div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Free Bids</p>
                        <p className="text-3xl font-black text-violet-400">{data?.freeBids || 0}</p>
                    </div>
                    <div className="card text-center group">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <span className="text-xl">👥</span>
                        </div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Friends Referred</p>
                        <p className="text-3xl font-black text-white">{data?.referrals.length || 0}</p>
                    </div>
                </div>

                {/* Claim Credits Card */}
                {(data?.referralCredits || 0) > 0 && (
                    <div className="card mb-8 border-2 border-emerald-500/20" style={{ animation: 'fadeUp 0.6s ease-out 0.15s both' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🎉</span>
                            <h2 className="text-lg font-bold text-white">You have {data!.referralCredits} credit{data!.referralCredits > 1 ? 's' : ''} to redeem!</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-5">Choose how to use your credits — each credit gives you one free action:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => claimCredit('posting')}
                                disabled={claiming}
                                className="bg-blue-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 rounded-xl p-5 text-left transition-all hover:bg-blue-500/15 active:scale-98 disabled:opacity-50 group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">📋</span>
                                    <span className="text-white font-bold">Free Project Posting</span>
                                </div>
                                <p className="text-gray-500 text-xs">Post a project for free — skip the posting fee and get your project live instantly.</p>
                                <span className="inline-block mt-3 text-blue-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
                                    {claiming ? 'Claiming...' : 'Redeem as Posting →'}
                                </span>
                            </button>
                            <button
                                onClick={() => claimCredit('bid')}
                                disabled={claiming}
                                className="bg-violet-500/10 border-2 border-violet-500/20 hover:border-violet-500/40 rounded-xl p-5 text-left transition-all hover:bg-violet-500/15 active:scale-98 disabled:opacity-50 group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">🎯</span>
                                    <span className="text-white font-bold">Free Bid</span>
                                </div>
                                <p className="text-gray-500 text-xs">Place a bid on a project for free — stand out without spending a thing.</p>
                                <span className="inline-block mt-3 text-violet-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
                                    {claiming ? 'Claiming...' : 'Redeem as Bid →'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Referral Code Card */}
                <div className="card mb-8" style={{ animation: 'fadeUp 0.6s ease-out 0.2s both' }}>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Your Referral Code
                    </h2>

                    {/* Code display */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 flex items-center justify-between">
                            <span className="text-2xl font-black text-emerald-400 tracking-[0.2em] select-all">{data?.referralCode}</span>
                            <button
                                onClick={copyCode}
                                className={`ml-3 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${copied
                                    ? 'bg-emerald-500 text-gray-950'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Shareable link */}
                    <div>
                        <label className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Shareable Link</label>
                        <div className="flex items-center gap-2 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3">
                            <p className="flex-1 text-sm text-gray-400 truncate select-all">{referralLink}</p>
                            <button
                                onClick={copyLink}
                                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${copiedLink
                                    ? 'bg-emerald-500 text-gray-950'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {copiedLink ? '✓ Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="card mb-8" style={{ animation: 'fadeUp 0.6s ease-out 0.3s both' }}>
                    <h2 className="text-lg font-bold text-white mb-6">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: '1', icon: '📤', title: 'Share Your Code', desc: 'Send your unique referral code or link to friends.' },
                            { step: '2', icon: '👋', title: 'Friend Joins & Completes a Project', desc: 'Your friend registers with your code and completes their first project.' },
                            { step: '3', icon: '🎟️', title: 'Both Earn a Credit', desc: 'You and your friend each get 1 free credit — redeem as a free posting or free bid!' },
                        ].map((item) => (
                            <div key={item.step} className="relative">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <div className="text-2xl mb-2">{item.icon}</div>
                                        <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                                        <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Referred Friends Table */}
                <div className="card" style={{ animation: 'fadeUp 0.6s ease-out 0.4s both' }}>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Your Referrals
                    </h2>

                    {(!data?.referrals || data.referrals.length === 0) ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No referrals yet</p>
                            <p className="text-gray-600 text-xs mt-1">Share your code to start earning free credits!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wider py-3 px-2">Friend</th>
                                        <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wider py-3 px-2">Status</th>
                                        <th className="text-left text-gray-500 font-semibold text-xs uppercase tracking-wider py-3 px-2">Reward</th>
                                        <th className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wider py-3 px-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.referrals.map((r) => (
                                        <tr key={r._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                                        {r.referredUserName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-white font-medium">{r.referredUserName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'rewarded'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {r.status === 'rewarded' ? '✓ Credit Earned' : '⏳ Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-white font-bold">
                                                {r.status === 'rewarded' ? '🎟️ 1 Credit' : '—'}
                                            </td>
                                            <td className="py-3 px-2 text-right text-gray-500 text-xs">
                                                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
