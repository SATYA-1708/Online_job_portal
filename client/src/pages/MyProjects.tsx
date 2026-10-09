import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_BASE } from '../config';
import { SEO } from '../components/SEO';

interface Project {
    _id: string;
    title: string;
    description: string;
    budget: number;
    user: any;
    userName: string;
    createdAt: string;
    bids: any[];
    status?: string;
    awardedTo?: any;
    awardedToName?: string;
}

type Tab = 'posted' | 'working';

const toId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (typeof value._id === 'string') return value._id;
        if (typeof value.$oid === 'string') return value.$oid;
        if (value._id && typeof value._id.toString === 'function') return value._id.toString();
        if (typeof value.toString === 'function') return value.toString();
    }
    return String(value);
};

export const MyProjects = () => {
    const { user } = useAuth();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('posted');

    useEffect(() => {
        if (user) fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/projects/my`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setAllProjects(data);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-gray-400 text-lg mb-6">Sign in to access your projects</p>
                    <Link to="/login" className="btn-primary">Log In</Link>
                </div>
            </div>
        );
    }

    const myId = toId(user._id);
    const posted = allProjects.filter(p => toId(p.user) === myId);
    const working = allProjects.filter(p => toId(p.awardedTo) === myId && p.status === 'awarded');
    const projects = tab === 'posted' ? posted : working;

    const totalSpend = posted.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalEarnings = working.reduce((sum, p) => sum + Number(p.budget || 0), 0);

    return (
        <div className="min-h-screen bg-gray-950 px-4 pt-12 pb-12">
            <SEO title="My Projects | TECHSPARKX" />

            <div className="max-w-7xl mx-auto">
                {/* Dashboard Badge & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-violet-600/20 text-violet-400 rounded-lg flex items-center justify-center border border-violet-500/30">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <span className="text-violet-400 text-xs font-black uppercase tracking-widest">DASHBOARD</span>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-1 tracking-tight">My Projects</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Manage your posted projects and active freelance work</p>
                    </div>

                    <Link to="/post-project" className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95">
                        <span className="text-xl leading-none">+</span>
                        Post New Project
                    </Link>
                </div>

                {/* Stats Grid exactly like snapshot */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 shadow-xl">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">POSTED</p>
                        <p className="text-2xl font-black text-white">{posted.length}</p>
                    </div>
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 shadow-xl">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">WORKING ON</p>
                        <p className="text-2xl font-black text-white">{working.length}</p>
                    </div>
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 shadow-xl">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">TOTAL SPEND</p>
                        <p className="text-2xl font-black text-emerald-400">₹{totalSpend}</p>
                    </div>
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 shadow-xl">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">EARNINGS</p>
                        <p className="text-2xl font-black text-cyan-400">₹{totalEarnings}</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setTab('posted')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'posted'
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-500 hover:text-gray-400'
                            }`}
                    >
                        <span className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px]">📄</span>
                        Posted ({posted.length})
                    </button>
                    <button
                        onClick={() => setTab('working')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === 'working'
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-500 hover:text-gray-400'
                            }`}
                    >
                        <span className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px]">⚙️</span>
                        Working On ({working.length})
                    </button>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-900/30 rounded-3xl border border-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-900/20 rounded-[32px] border border-dashed border-gray-800/50">
                        <div className="w-20 h-20 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center mb-6 shadow-2xl">
                            <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No projects posted yet</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(p => (
                            <Link key={p._id} to={`/projects/${p._id}`} className="group bg-gray-900/40 border border-gray-800/60 hover:border-emerald-500/30 rounded-[24px] p-6 transition-all duration-300 shadow-lg flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${p.status === 'awarded'
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                        {p.status || 'open'}
                                    </span>
                                    <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{timeAgo(p.createdAt)}</span>
                                </div>

                                <h3 className="text-xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-2">{p.title}</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3 mb-8">{p.description}</p>

                                <div className="mt-auto pt-6 border-t border-gray-800/60 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Budget</span>
                                        <span className="text-emerald-400 font-black text-xl tracking-tighter">₹{p.budget}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Bids</span>
                                        <span className="text-gray-200 font-black text-sm bg-gray-800/80 px-4 py-1.5 rounded-xl border border-gray-700/50">{p.bids?.length || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
