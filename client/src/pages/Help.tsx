import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
    {
        q: 'How do I post a project?',
        a: 'Sign up as an employer, then click "Post Job" in the navigation bar. Fill in the project title, description, and budget, then submit.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
    },
    {
        q: 'How do I bid on a project?',
        a: 'Sign up as a freelancer, browse available jobs, click on a project, and submit your bid amount and proposal.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>,
    },
    {
        q: 'How does messaging work?',
        a: 'You can message any user from their profile or from a project page. Click the "Message" button and start chatting. You can also send files and images.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
        q: 'Is there a file size limit for attachments?',
        a: 'Yes, the maximum file size for chat attachments is 10MB. All common file types are supported.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
    },
    {
        q: 'How do I update my profile?',
        a: 'Go to your Profile page and click "Edit Profile". You can update your name, bio, skills, and hourly rate.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
        q: 'How does payment protection work?',
        a: 'When an employer awards a bid, a payment record is created. The freelancer can start work, submit it upon completion, and the employer releases the payment once satisfied.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
    {
        q: 'Is TECHSPARKX free to use?',
        a: 'Yes, TECHSPARKX is completely free to sign up and use. There are no hidden fees for posting projects or bidding.',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
];

const steps = [
    {
        num: '01',
        title: 'Create an Account',
        desc: 'Sign up as a freelancer to find work, or as an employer to hire talent.',
        link: '/register',
        linkText: 'Sign Up',
        color: 'from-emerald-500 to-cyan-500',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
    },
    {
        num: '02',
        title: 'Post or Browse',
        desc: 'Employers post projects with budgets. Freelancers browse and bid on the ones they like.',
        link: '/projects',
        linkText: 'Browse Jobs',
        color: 'from-blue-500 to-indigo-500',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    {
        num: '03',
        title: 'Collaborate',
        desc: 'Message each other, share files, track payments, and get the job done together.',
        link: '/inbox',
        linkText: 'Messages',
        color: 'from-violet-500 to-purple-500',
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-400',
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    },
];

export const Help = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-gray-800/50">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2" />

                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                <div className="relative container mx-auto px-4 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6" style={{ animation: 'fadeUp 0.5s ease-out' }}>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-400 text-sm font-bold">Help Center</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight" style={{ animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
                        How can we help?
                    </h1>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed" style={{ animation: 'fadeUp 0.5s ease-out 0.2s both' }}>
                        Everything you need to know about getting started and using TECHSPARKX effectively
                    </p>
                </div>
            </div>

            {/* Getting Started */}
            <section className="py-20">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                        <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Quick Start</span>
                        <h2 className="text-3xl font-bold text-white mt-2">Getting Started in 3 Steps</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="group relative"
                                style={{ animation: `fadeUp 0.5s ease-out ${0.1 + i * 0.1}s both` }}
                            >
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.color} rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-all duration-500`} />
                                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800/80 p-8 text-center h-full transition-all duration-300 group-hover:border-gray-700">
                                    {/* Step Number */}
                                    <div className="absolute top-4 right-4 text-gray-800 text-4xl font-black select-none">{step.num}</div>

                                    <div className={`w-16 h-16 ${step.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 ${step.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                        {step.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{step.desc}</p>
                                    <Link to={step.link} className={`${step.iconColor} text-sm font-bold hover:underline inline-flex items-center gap-1 group/link`}>
                                        {step.linkText}
                                        <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 border-t border-gray-800/50 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
                <div className="container mx-auto px-4 max-w-3xl relative">
                    <div className="text-center mb-12">
                        <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">FAQ</span>
                        <h2 className="text-3xl font-bold text-white mt-2">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="group"
                                style={{ animation: `fadeUp 0.4s ease-out ${i * 0.06}s both` }}
                            >
                                <div className={`bg-gray-900/60 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden ${openIndex === i ? 'border-emerald-500/30' : 'border-gray-800/80 hover:border-gray-700'}`}>
                                    <button
                                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                        className="w-full flex items-center gap-4 p-5 text-left"
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${openIndex === i ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800/60 text-gray-500'}`}>
                                            {faq.icon}
                                        </div>
                                        <span className={`font-semibold text-sm flex-1 transition-colors ${openIndex === i ? 'text-emerald-400' : 'text-white'}`}>
                                            {faq.q}
                                        </span>
                                        <svg className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-emerald-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div className={`transition-all duration-300 overflow-hidden ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-5 pb-5 pl-[72px]">
                                            <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section className="py-20 border-t border-gray-800/50">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <div className="relative" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl" />
                        <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800/80 p-12">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Still need help?</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Our support team is here for you. Reach out anytime and we'll get back to you within 24 hours.</p>
                            <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                                <a href="mailto:support@techsparkx.com" className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 hover:border-emerald-500/30 transition-all group">
                                    <svg className="w-6 h-6 text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-emerald-400 transition-colors">Email Us</h3>
                                    <p className="text-emerald-400 text-xs font-medium">support@techsparkx.com</p>
                                </a>
                                <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/30 transition-all group">
                                    <svg className="w-6 h-6 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-blue-400 transition-colors">Live Chat</h3>
                                    <p className="text-gray-500 text-xs">Available 24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
