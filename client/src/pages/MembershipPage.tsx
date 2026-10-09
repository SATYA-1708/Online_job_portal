import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { openCreditCheckout, openBadgeCheckout } from '../utils/razorpayCheckout';


const CREDIT_PACKS = [
    { id: 'credits_5', label: '5 Credits', price: 49, desc: 'Great for occasional deals', popular: false },
    { id: 'credits_15', label: '15 Credits', price: 99, desc: 'Most popular — best value', popular: true },
    { id: 'credits_30', label: '30 Credits', price: 179, desc: 'For power users & agencies', popular: false },
];

export const MembershipPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [loading, setLoading] = useState<string | null>(null);
    const [creditLoading, setCreditLoading] = useState<string | null>(null);

    const plans = [
        {
            name: 'Pro',
            price: 99,
            period: 'year',
            badge: 'Pro',
            color: 'from-amber-400 to-yellow-500',
            features: ['Verified Pro Badge', 'Stand out in search results', 'Apply to 50 jobs/month', 'Basic Analytics'],
            popular: false,
        },
        {
            name: 'Expert',
            price: 199,
            period: 'year',
            badge: 'Expert',
            color: 'from-blue-500 to-cyan-500',
            features: ['Top Expert Badge', 'Priority in search results', 'Unlimited job applications', 'Advanced Analytics', 'Priority Support'],
            popular: true,
        },
    ];

    const handleSubscribe = async (plan: typeof plans[0]) => {
        if (!user) { navigate('/login'); return; }
        setLoading(plan.name);
        try {
            await openBadgeCheckout({
                badgeType: plan.badge as 'Pro' | 'Expert',
                token: user.token,
                userName: user.name,
                userEmail: user.email || '',
                onSuccess: (updatedUser) => {
                    login(updatedUser);
                    alert(`✅ ${updatedUser.message}`);
                    navigate('/profile');
                },
                onError: (msg) => alert(`❌ Payment failed: ${msg}`),
            });
        } finally {
            setLoading(null);
        }
    };

    const handleBuyCredits = async (pack: typeof CREDIT_PACKS[0]) => {
        if (!user) { navigate('/login'); return; }
        setCreditLoading(pack.id);
        try {
            await openCreditCheckout({
                packId: pack.id,
                token: user.token,
                userName: user.name,
                userEmail: user.email || '',
                onSuccess: (updatedUser) => {
                    login(updatedUser);
                    alert(`✅ ${updatedUser.message}`);
                },
                onError: (msg) => alert(`❌ Payment failed: ${msg}`),
            });
        } finally {
            setCreditLoading(null);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-16">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gray-950" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-20" />
            </div>

            <div className="container mx-auto px-4 relative z-10">

                {/* ── Badge Plans ── */}
                <div className="text-center max-w-2xl mx-auto mb-16" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Power Level</span>
                    </h1>
                    <p className="text-gray-400 text-lg mb-8">
                        Unlock premium features, stand out from the crowd, and accelerate your career.
                    </p>
                    <div className="inline-flex items-center bg-gray-900 rounded-full p-1 border border-gray-800">
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Yearly <span className="text-emerald-400 text-xs ml-1">-20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
                    {plans.map((plan, idx) => (
                        <div
                            key={plan.name}
                            className={`relative bg-gray-900/60 backdrop-blur-xl border rounded-2xl p-8 transition-all hover:-translate-y-2 duration-300 ${plan.popular ? 'border-cyan-500/50 shadow-2xl shadow-cyan-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                            style={{ animation: `fadeUp 0.6s ease-out ${idx * 0.1}s backwards` }}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">₹{plan.price}</span>
                                    <span className="text-gray-500">/{plan.period}</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-2">Billed yearly</p>
                            </div>
                            <div className={`h-px w-full bg-gradient-to-r ${plan.color} opacity-20 mb-8`} />
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300">
                                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleSubscribe(plan)}
                                disabled={Boolean(loading) || user?.badge === plan.badge}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${user?.badge === plan.badge ? 'bg-gray-800 cursor-default opacity-50' : `bg-gradient-to-r ${plan.color} hover:opacity-90`}`}
                            >
                                {loading === plan.name ? 'Processing...' : user?.badge === plan.badge ? 'Current Plan' : 'Get Started'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* ── Credits Section ── */}
                <div className="max-w-4xl mx-auto" style={{ animation: 'fadeUp 0.6s ease-out 0.3s backwards' }}>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-white mb-3">
                            💳 Buy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Credits</span>
                        </h2>
                        <p className="text-gray-400 text-base max-w-lg mx-auto">
                            1 credit is deducted from <strong className="text-white">each party</strong> when a work agreement is created. New accounts start with <strong className="text-emerald-400">3 free credits</strong>.
                        </p>
                        {user && (
                            <div className="mt-5 inline-flex items-center gap-2 bg-gray-900 border border-gray-800 px-5 py-2.5 rounded-full text-sm">
                                <span className="text-gray-400">Your balance:</span>
                                <span className="text-emerald-400 font-bold text-base">{(user as any).credits ?? 0} credits</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {CREDIT_PACKS.map((pack, idx) => (
                            <div
                                key={pack.id}
                                className={`relative bg-gray-900/60 backdrop-blur-xl border rounded-2xl p-6 text-center transition-all hover:-translate-y-1 duration-300 ${pack.popular ? 'border-emerald-500/50 shadow-xl shadow-emerald-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                                style={{ animation: `fadeUp 0.5s ease-out ${0.4 + idx * 0.1}s backwards` }}
                            >
                                {pack.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                                        BEST VALUE
                                    </div>
                                )}
                                <div className="text-4xl font-black text-white mb-1">{pack.label}</div>
                                <p className="text-gray-500 text-sm mb-6">{pack.desc}</p>
                                <div className="flex items-baseline justify-center gap-1 mb-6">
                                    <span className="text-3xl font-black text-emerald-400">₹{pack.price}</span>
                                    <span className="text-gray-500 text-sm">one-time</span>
                                </div>
                                <button
                                    onClick={() => handleBuyCredits(pack)}
                                    disabled={Boolean(creditLoading)}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${pack.popular ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'}`}
                                >
                                    {creditLoading === pack.id ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
