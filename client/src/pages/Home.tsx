import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '../components/SEO';

/* ── Animated counter ── */
const Counter = ({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                let s = 0;
                const step = Math.max(1, Math.floor(target / 50));
                const iv = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(iv); } else setCount(s); }, 25);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [target]);
    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/* ── Scroll reveal ── */
const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [v, setV] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(40px)', transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
            {children}
        </div>
    );
};

/* ── Typewriter ── */
const Typewriter = ({ words }: { words: string[] }) => {
    const [idx, setIdx] = useState(0);
    const [text, setText] = useState('');
    const [del, setDel] = useState(false);
    useEffect(() => {
        const w = words[idx];
        const timeout = setTimeout(() => {
            if (!del) {
                setText(w.slice(0, text.length + 1));
                if (text.length + 1 === w.length) setTimeout(() => setDel(true), 2000);
            } else {
                if (text.length === 0) { setDel(false); setIdx((idx + 1) % words.length); }
                else setText(w.slice(0, text.length - 1));
            }
        }, del ? 40 : 80);
        return () => clearTimeout(timeout);
    }, [text, del, idx, words]);
    return <>{text}<span className="animate-pulse">|</span></>;
};

const TYPEWRITER_WORDS = ['freelancer.', 'developer.', 'client.'];

export const Home = () => {
    const { user } = useAuth();
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', h);
        return () => window.removeEventListener('mousemove', h);
    }, []);

    const testimonials = [
        { name: 'Sarah Chen', role: 'UI/UX Designer', text: 'TECHSPARKX helped me land my dream clients. The platform is intuitive and the milestone payment system gives me peace of mind.', rating: 5 },
        { name: 'James Parker', role: 'CEO, TechVentures', text: 'We found an incredible developer within hours. The quality of talent here is unmatched.', rating: 5 },
        { name: 'Maria Lopez', role: 'Full Stack Dev', text: 'The built-in chat and file sharing make collaboration seamless. Best freelance platform I\'ve used.', rating: 5 },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col overflow-hidden">
            <SEO
                title="TECHSPARKX - Hire the Best Indian Freelancers"
                description="The leading platform in India to find developers, designers, and digital experts. Post your project for free and get competitive bids within minutes."
            />

            {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
            <section className="relative py-28 lg:py-44 overflow-hidden">
                {/* Animated mesh gradient background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
                    <div className="absolute w-[700px] h-[700px] rounded-full blur-[150px] opacity-15"
                        style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)', left: `calc(25% + ${mouse.x * 0.02}px)`, top: `calc(15% + ${mouse.y * 0.02}px)`, transition: 'left 0.4s, top 0.4s' }}></div>
                    <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
                        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', right: `calc(15% - ${mouse.x * 0.01}px)`, top: `calc(30% - ${mouse.y * 0.01}px)`, transition: 'right 0.4s, top 0.4s' }}></div>
                    <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
                        style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', left: `calc(60% + ${mouse.x * 0.015}px)`, bottom: `calc(10% + ${mouse.y * 0.015}px)`, transition: 'left 0.4s, bottom 0.4s' }}></div>
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{
                                width: `${2 + (i % 3) * 2}px`, height: `${2 + (i % 3) * 2}px`,
                                background: i % 2 === 0 ? '#34d399' : '#06b6d4',
                                left: `${8 + i * 7.5}%`, top: `${15 + (i * 17) % 70}%`,
                                animation: `float ${3 + i * 0.4}s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.3}s`, opacity: 0.3 + (i % 4) * 0.1,
                            }}></div>
                    ))}
                </div>

                {/* Orbiting rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.07]">
                    <div className="w-full h-full border border-emerald-400 rounded-full" style={{ animation: 'spin 40s linear infinite' }}></div>
                    <div className="absolute inset-12 border border-purple-400 rounded-full" style={{ animation: 'spin 30s linear infinite reverse' }}></div>
                    <div className="absolute inset-24 border border-cyan-400 rounded-full" style={{ animation: 'spin 20s linear infinite' }}></div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-10"
                        style={{ animation: 'slideDown 0.8s ease forwards' }}>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                        </span>
                        <span className="text-emerald-400 text-sm font-semibold tracking-wider uppercase">Now in Beta — Join Free</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[1.05]">
                        <span className="inline-block" style={{ animation: 'wordReveal 0.7s ease forwards 0.2s', opacity: 0 }}>Find </span>
                        <span className="inline-block" style={{ animation: 'wordReveal 0.7s ease forwards 0.35s', opacity: 0 }}>the </span>
                        <span className="inline-block" style={{ animation: 'wordReveal 0.7s ease forwards 0.5s', opacity: 0 }}>perfect</span>
                        <br />
                        <span className="inline-block text-transparent bg-clip-text" style={{
                            backgroundImage: 'linear-gradient(135deg, #34d399 0%, #06b6d4 50%, #8b5cf6 100%)',
                            backgroundSize: '200% auto',
                            animation: 'wordReveal 0.7s ease forwards 0.7s, shimmer 4s linear infinite 1.4s',
                            opacity: 0,
                            WebkitBackgroundClip: 'text',
                        }}>
                            <Typewriter words={TYPEWRITER_WORDS} />
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-lg md:text-xl text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed"
                        style={{ animation: 'fadeUp 0.8s ease forwards 1s', opacity: 0 }}>
                        TECHSPARKX connects top talent with visionary businesses.<br />
                        <span className="text-gray-300 font-medium">Post. Bid. Build. </span>
                        All in one place.
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4"
                        style={{ animation: 'scaleIn 0.6s ease forwards 1.3s', opacity: 0 }}>
                        <Link to="/projects" className="group relative overflow-hidden btn-primary px-10 py-4 text-lg glow-emerald">
                            <span className="relative z-10 flex items-center gap-2">
                                Explore Projects
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }}></div>
                        </Link>
                        <Link to={user?.role === 'employer' ? '/post-project' : '/register'} className="btn-secondary px-10 py-4 text-lg group hover:border-emerald-500/30">
                            {user?.role === 'employer' ? 'Post a Job' : 'Get Started Free'}
                        </Link>
                    </div>

                    {/* Trust bar */}
                    <div className="mt-16 flex items-center justify-center gap-6 text-gray-600 text-sm"
                        style={{ animation: 'fadeUp 0.8s ease forwards 1.6s', opacity: 0 }}>
                        <div className="flex -space-x-2">
                            {['S', 'J', 'M', 'A', 'K'].map((l, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-950 flex items-center justify-center text-xs font-bold"
                                    style={{ background: ['#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'][i], color: '#111' }}>
                                    {l}
                                </div>
                            ))}
                        </div>
                        <span>Trusted by <span className="text-white font-semibold">10,000+</span> professionals</span>
                    </div>
                </div>
            </section>

            {/* ══════════════════ MARQUEE ══════════════════ */}
            <section className="py-8 border-t border-b border-gray-800/40 overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-950 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-950 to-transparent z-10"></div>
                <div className="flex gap-12 items-center" style={{ animation: 'marquee 20s linear infinite', width: 'max-content' }}>
                    {[...Array(2)].map((_, rep) => (
                        <React.Fragment key={rep}>
                            {['React', 'Node.js', 'Python', 'Figma', 'AWS', 'Flutter', 'TypeScript', 'Go', 'Docker', 'Rust'].map((t, i) => (
                                <span key={`${rep}-${i}`} className="text-gray-600 text-sm font-semibold tracking-wider uppercase whitespace-nowrap px-4">
                                    {t}
                                </span>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </section>

            {/* ══════════════════ STATS ══════════════════ */}
            <section className="py-24 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/30 to-gray-950"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { val: 1139, suffix: '+', label: 'Active Freelancers', emoji: '👩‍💻' },
                            { val: 563, suffix: '+', label: 'Projects Posted', emoji: '📋' },
                            { val: 480, suffix: 'K+', label: 'Paid to Freelancers', emoji: '💰', prefix: '₹' },
                            { val: 96, suffix: '%', label: 'Satisfaction Rate', emoji: '⭐' },
                        ].map((s, i) => (
                            <Reveal key={i} delay={i * 0.1}>
                                <div className="card text-center p-8 group hover:scale-105 transition-transform duration-300">
                                    <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-300">{s.emoji}</div>
                                    <div className="text-3xl md:text-4xl font-black text-white mb-2">
                                        <Counter target={s.val} suffix={s.suffix} prefix={s.prefix || ''} />
                                    </div>
                                    <div className="text-gray-500 text-sm font-medium">{s.label}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ FEATURES ══════════════════ */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <Reveal>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Features
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">
                                Top-tier tools for project
                                <span className="text-transparent bg-clip-text ml-2" style={{
                                    backgroundImage: 'linear-gradient(135deg, #34d399, #06b6d4)',
                                    WebkitBackgroundClip: 'text',
                                }}>management</span>
                            </h2>
                            <p className="text-gray-500 max-w-xl mx-auto text-lg">Powerful tools built for the modern workforce.</p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: '🛡️', title: 'Secure Contracts', desc: 'Funds held safely until milestones are approved. Zero risk.', gradient: 'from-emerald-500/20 to-emerald-500/5' },
                            { icon: '⚡', title: 'Smart Matching', desc: 'AI-powered recommendations connect you with ideal talent instantly.', gradient: 'from-cyan-500/20 to-cyan-500/5' },
                            { icon: '💬', title: 'Real-time Chat', desc: 'Built-in messaging with file sharing. No external tools needed.', gradient: 'from-purple-500/20 to-purple-500/5' },
                        ].map((f, i) => (
                            <Reveal key={i} delay={i * 0.15}>
                                <div className="card group p-8 hover:scale-[1.04] transition-all duration-500 cursor-default relative overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            {f.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                                        <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ HOW IT WORKS ══════════════════ */}
            <section className="py-24 border-t border-gray-800/40">
                <div className="container mx-auto px-4 max-w-5xl">
                    <Reveal>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span> How it Works
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">Three steps to launch</h2>
                            <p className="text-gray-500 text-lg">It's easier than you think.</p>
                        </div>
                    </Reveal>

                    <div className="relative">
                        <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0"></div>
                        <div className="grid md:grid-cols-3 gap-10">
                            {[
                                { step: '01', title: 'Create Account', desc: 'Sign up in seconds. Choose freelancer or employer.', color: 'emerald' },
                                { step: '02', title: 'Post or Discover', desc: 'Post your project or explore thousands of opportunities.', color: 'cyan' },
                                { step: '03', title: 'Collaborate & Deliver', desc: 'Chat, share files, and build something amazing.', color: 'purple' },
                            ].map((s, i) => (
                                <Reveal key={i} delay={i * 0.2}>
                                    <div className="text-center group">
                                        <div className={`w-16 h-16 mx-auto mb-6 bg-gray-900 border-2 border-${s.color}-500/30 rounded-2xl flex items-center justify-center text-${s.color}-400 font-black text-lg group-hover:bg-${s.color}-500 group-hover:text-gray-950 group-hover:border-${s.color}-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg transition-all duration-500`}
                                            style={{ boxShadow: 'none' }}
                                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 40px -5px var(--color-${s.color}-500)`}
                                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                                            {s.step}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                                        <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════ TESTIMONIALS ══════════════════ */}
            <section className="py-24 border-t border-gray-800/40 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]"></div>
                <div className="container mx-auto px-4">
                    <Reveal>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> Testimonials
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">Loved by thousands</h2>
                            <p className="text-gray-500 text-lg">See what our community has to say.</p>
                        </div>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                        {testimonials.map((t, i) => (
                            <Reveal key={i} delay={i * 0.15} className="h-full">
                                <div className="card p-8 hover:scale-[1.03] transition-all duration-500 group h-full flex flex-col justify-between">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <span key={j} className="text-yellow-400 text-lg group-hover:scale-110 transition-transform" style={{ transitionDelay: `${j * 50}ms` }}>★</span>
                                        ))}
                                    </div>
                                    <p className="text-gray-300 leading-relaxed mb-6 italic flex-grow">"{t.text}"</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-800 mt-auto">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-gray-950 font-bold text-sm">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold text-sm">{t.name}</div>
                                            <div className="text-gray-500 text-xs">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ FINAL CTA ══════════════════ */}
            {!user && (
                <section className="py-32 border-t border-gray-800/40 relative overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
                        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
                    </div>
                    <Reveal className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                            Your next big project
                            <br />
                            <span className="text-transparent bg-clip-text" style={{
                                backgroundImage: 'linear-gradient(135deg, #34d399, #06b6d4, #8b5cf6)',
                                backgroundSize: '200% auto',
                                animation: 'shimmer 4s linear infinite',
                                WebkitBackgroundClip: 'text',
                            }}>starts here.</span>
                        </h2>
                        <p className="text-gray-500 mb-12 max-w-xl mx-auto text-lg">Join TECHSPARKX for free and unlock a world of opportunity.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="group relative overflow-hidden btn-primary px-10 py-4 text-lg glow-emerald">
                                <span className="relative z-10 flex items-center gap-2">
                                    Get Started Free
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }}></div>
                            </Link>
                            <Link to="/projects" className="btn-secondary px-10 py-4 text-lg">
                                Browse Projects
                            </Link>
                        </div>
                    </Reveal>
                </section>
            )}

            {/* ══════════════════ FOOTER ══════════════════ */}
            <footer className="border-t border-gray-800/40 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center">
                            <span className="text-xl font-black tracking-tight">
                                <span className="text-white">TECH</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">SPARK</span><span className="text-cyan-400">X</span>
                            </span>
                        </div>
                        <div className="flex gap-8 text-gray-500 text-sm">
                            <Link to="/projects" className="hover:text-white transition-colors">Jobs</Link>
                            <Link to="/help" className="hover:text-white transition-colors">Help</Link>
                            <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
                        </div>
                        <p className="text-gray-600 text-sm">© 2026 TECHSPARKX. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
