import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const About = () => {
    const { user } = useAuth();
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStatsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (statsRef.current) {
            observer.observe(statsRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const AnimatedCounter = ({ end, duration = 2000 }: { end: number, duration?: number }) => {
        const [count, setCount] = useState(0);

        useEffect(() => {
            if (!statsVisible) return;

            let startTime: number | null = null;
            const step = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                setCount(Math.floor(progress * end));
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }, [statsVisible, end, duration]);

        return <span>{count.toLocaleString()}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-950 overflow-x-hidden">
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-12 { transform: rotateY(12deg); }
                .rotate-y-n12 { transform: rotateY(-12deg); }
                .card-3d:hover { transform: translateY(-10px) rotateX(5deg); }
            `}</style>

            {/* Hero Section */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black" />

                {/* Animated Orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse-glow_8s_ease-in-out_infinite]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen animate-[pulse-glow_10s_ease-in-out_infinite_reverse]" />

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1 h-1 bg-white/20 rounded-full animate-[float_${3 + Math.random() * 5}s_ease-in-out_infinite]`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                opacity: Math.random() * 0.5 + 0.2
                            }}
                        />
                    ))}
                </div>

                <div className="relative container mx-auto px-4 z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-[fadeIn_1s_ease-out]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Reimagining Work</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight animate-[slideUp_1s_ease-out_0.2s_both]">
                        The Future is <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                            Distributed.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12 animate-[slideUp_1s_ease-out_0.4s_both]">
                        TECHSPARKX connects borders, cultures, and skills. We're building the infrastructure for the global digital economy.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-[slideUp_1s_ease-out_0.6s_both]">
                        <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                            Join the Revolution
                        </button>
                        <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-white text-gray-950 flex items-center justify-center">▶</span>
                            Watch Our Story
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* Stats Section */}
            <div ref={statsRef} className="relative py-32 bg-gray-950 border-y border-white/5">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { label: 'Active Freelancers', value: 1139, suffix: '+', color: 'emerald', delay: 0 },
                            { label: 'Projects Completed', value: 563, suffix: '+', color: 'cyan', delay: 200 },
                            { label: 'Total Paid Out', value: 480, prefix: '₹', suffix: 'K+', color: 'violet', delay: 400 }
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`transform transition-all duration-1000 ${statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                                style={{ transitionDelay: `${stat.delay}ms` }}
                            >
                                <div className={`text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 mb-4`}>
                                    {stat.prefix}<AnimatedCounter end={stat.value} />{stat.suffix}
                                </div>
                                <p className={`text-${stat.color}-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2`}>
                                    <span className={`w-2 h-2 rounded-full bg-${stat.color}-400 animate-pulse`} />
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3D Cards Section */}
            <div className="py-32 bg-gray-900 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2 perspective-1000">
                            <div className="relative group transition-transform duration-500 transform rotate-y-12 hover:rotate-y-0 preserve-3d">
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                                <div className="relative bg-gray-950 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden card-3d transition-transform duration-500">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg shadow-emerald-500/20">
                                            🚀
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-4">Built for Builders</h3>
                                        <p className="text-gray-400 leading-relaxed mb-8">
                                            TECHSPARKX was founded on a simple belief: talent is distributed equally, but opportunity is not. We're bridging that gap by providing a secure, transparent, and efficient platform.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { icon: '🛡️', title: 'Secure Contracts', desc: 'Protected payments' },
                                                { icon: '⚡', title: 'Instant Chat', desc: 'Real-time sync' },
                                                { icon: '🌍', title: 'Global Pool', desc: '150+ countries' },
                                                { icon: '✨', title: 'Zero Fees', desc: 'For early adopters' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <span className="text-xl">{item.icon}</span>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm">{item.title}</h4>
                                                        <p className="text-gray-500 text-[10px]">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2">
                            <span className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-4 block">Our Values</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                                Creating a specific <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Standard of Excellence</span>
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { title: 'Transparency First', desc: 'We believe in clear pricing, honest feedback, and open communication.', color: 'emerald' },
                                    { title: 'Quality Over Quantity', desc: 'We curate the best talent to ensure every project is a masterpiece.', color: 'cyan' },
                                    { title: 'Community Driven', desc: 'We are built by freelancers, for freelancers. Your success is our success.', color: 'violet' }
                                ].map((item, i) => (
                                    <div key={i} className="group flex gap-6 p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-default">
                                        <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                            <p className="text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative py-24 bg-black overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
                        {user ? 'Ready to work?' : 'Ready to get started?'}
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                        {user
                            ? 'Find your next opportunity or hire the perfect talent today.'
                            : 'Join thousands of creators and companies building the future together.'}
                    </p>

                    {user ? (
                        <Link to="/projects" className="px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl shadow-white/10 inline-block">
                            Browse Jobs
                        </Link>
                    ) : (
                        <Link to="/register" className="px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl shadow-white/10 inline-block">
                            Create Your Account
                        </Link>
                    )}

                    {!user && <p className="mt-6 text-sm text-gray-500">No credit card required · Free for freelancers</p>}
                </div>
            </div>
        </div>
    );
};
