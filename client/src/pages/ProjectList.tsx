import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { SEO } from '../components/SEO';

interface Project {
    _id: string;
    title: string;
    description: string;
    budget: number;
    userName: string;
    userBadge?: string;
    createdAt: string;
    bids: any[];
    status?: string;
}

export const ProjectList = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'budget-high' | 'budget-low' | 'most-bids'>('newest');

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE}/projects`);
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setProjects(data);
            } else {
                console.error('Failed to fetch projects or invalid format:', data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = projects.filter(p => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.userName.toLowerCase().includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'budget-high': return b.budget - a.budget;
            case 'budget-low': return a.budget - b.budget;
            case 'most-bids': return b.bids.length - a.bids.length;
            default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="min-h-screen">
            <SEO
                title={`Browse ${projects.length} Freelance Jobs`}
                description="Explore high-paying freelance projects in India. Filter by budget, skills, and newest postings. Start bidding today on TECHSPARKX."
            />
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-gray-800/50">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative container mx-auto px-4 py-12 pb-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider">Job Board</span>
                            </div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Browse Jobs</h1>
                            <p className="text-gray-400 text-lg">Find your next opportunity from <span className="text-white font-semibold">{projects.length}</span> open projects</p>
                        </div>

                        {/* Stats Pills */}
                        <div className="flex gap-3 flex-wrap">
                            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Active Projects</p>
                                    <p className="text-white font-bold">{projects.length}</p>
                                </div>
                            </div>
                            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Budget</p>
                                    <p className="text-white font-bold">₹{totalBudget.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects by title, description, or employer..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder-gray-600"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-3.5 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm font-medium cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="budget-high">Budget: High → Low</option>
                        <option value="budget-low">Budget: Low → High</option>
                        <option value="most-bids">Most Bids</option>
                    </select>
                </div>

                {/* Results count */}
                {search && (
                    <p className="text-gray-500 text-sm mb-6">
                        Found <span className="text-white font-semibold">{sorted.length}</span> result{sorted.length !== 1 ? 's' : ''} for "<span className="text-emerald-400">{search}</span>"
                    </p>
                )}

                {/* Loading Skeleton */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4" style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s both` }}>
                                <div className="flex justify-between">
                                    <div className="h-6 w-16 bg-gray-800 rounded-md animate-pulse" />
                                    <div className="h-6 w-20 bg-gray-800 rounded-md animate-pulse" />
                                </div>
                                <div className="h-5 w-3/4 bg-gray-800 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-gray-800/60 rounded animate-pulse" />
                                    <div className="h-3 w-5/6 bg-gray-800/60 rounded animate-pulse" />
                                    <div className="h-3 w-2/3 bg-gray-800/60 rounded animate-pulse" />
                                </div>
                                <div className="pt-4 border-t border-gray-800 flex justify-between">
                                    <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sorted.length === 0 && projects.length > 0 ? (
                    /* No search results */
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No matching projects</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search terms</p>
                        <button onClick={() => setSearch('')} className="btn-secondary">Clear Search</button>
                    </div>
                ) : projects.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-20">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl rotate-6" />
                            <div className="absolute inset-0 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center">
                                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to post a project and find amazing talent!</p>
                        <Link to="/post-project" className="btn-primary">Post a Project</Link>
                    </div>
                ) : (
                    /* Project Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sorted.map((project, idx) => (
                            <Link
                                key={project._id}
                                to={`/projects/${project._id}`}
                                className="group relative"
                                style={{ animation: `fadeUp 0.5s ease-out ${Math.min(idx * 0.07, 0.5)}s both` }}
                            >
                                {/* Glow effect on hover */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/0 to-cyan-500/0 rounded-xl blur-lg opacity-0 group-hover:opacity-40 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-all duration-500" />

                                <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800/80 p-6 h-full flex flex-col transition-all duration-300 group-hover:border-emerald-500/30 group-hover:bg-gray-900">
                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            {project.status === 'awarded' ? (
                                                <span className="bg-amber-500/10 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Awarded
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Open
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 font-black text-xl leading-none">₹{project.budget}</p>
                                            <p className="text-gray-600 text-[10px] font-medium mt-0.5">BUDGET</p>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-[17px] font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2 leading-snug">
                                        {project.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-500 mb-5 flex-1 line-clamp-3 text-sm leading-relaxed">
                                        {project.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-gray-800">
                                                {project.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-gray-300 text-xs font-semibold">{project.userName}</p>
                                                    {project.userBadge === 'Pro' && (
                                                        <div className="bg-gradient-to-r from-amber-200 to-yellow-400 text-gray-950 text-[8px] font-black px-1 py-0 rounded flex items-center gap-0.5 shadow-[0_0_8px_-2px_rgba(251,191,36,0.5)]">
                                                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            PRO
                                                        </div>
                                                    )}
                                                    {project.userBadge === 'Expert' && (
                                                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-gray-950 text-[8px] font-black px-1 py-0 rounded flex items-center gap-0.5 shadow-[0_0_8px_-2px_rgba(34,211,238,0.5)]">
                                                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            EXPERT
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-[10px]">{timeAgo(project.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-xs font-semibold">{project.bids.length} bid{project.bids.length !== 1 ? 's' : ''}</span>
                                        </div>
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
