import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { API_BASE } from '../config';

interface ConversationPartner {
    _id: string;
    name: string;
    email: string;
    badge?: string;
}

const avatarGradients = [
    'from-emerald-500 to-cyan-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-indigo-500',
    'from-teal-500 to-green-500',
];

const getGradient = (name: string) => {
    if (!name) return avatarGradients[0];
    const index = name.charCodeAt(0) % avatarGradients.length;
    return avatarGradients[index];
};

export const Inbox = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState<ConversationPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Initial fetch
    useEffect(() => { fetchConversations(); }, [user]);

    // Socket listen for incoming messages to refresh the inbox list
    useEffect(() => {
        if (socket) {
            const handleReceiveMessage = () => {
                // When we receive ANY message, re-fetch the conversation list 
                // so the latest conversation pops to the top (if we had sorting) or simply updates.
                fetchConversations();
            };

            socket.on('receive_message', handleReceiveMessage);
            return () => {
                socket.off('receive_message', handleReceiveMessage);
            };
        }
    }, [socket]);

    const fetchConversations = async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setConversations(data);
            } else {
                console.error('Failed to fetch conversations:', data);
                setConversations([]);
            }
        } catch (error) {
            console.error(error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = conversations.filter(c =>
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="relative overflow-hidden border-b border-gray-800/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                <div className="absolute top-0 right-1/3 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-purple-500/8 rounded-full blur-3xl translate-y-1/2" />

                <div className="relative container mx-auto px-4 py-12 pb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Inbox</span>
                            </div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Messages</h1>
                            <p className="text-gray-400 text-lg">Stay connected with your clients and collaborators</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Conversations</p>
                                    <p className="text-white font-bold">{conversations.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Search */}
                    {conversations.length > 0 && (
                        <div className="relative mb-6" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all placeholder-gray-600"
                            />
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 flex items-center gap-4" style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s both` }}>
                                    <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                                        <div className="h-3 w-48 bg-gray-800/60 rounded animate-pulse" />
                                    </div>
                                    <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-20" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                            <div className="relative w-28 h-28 mx-auto mb-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl rotate-6 animate-pulse" />
                                <div className="absolute inset-0 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">No conversations yet</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                Start a conversation by messaging a freelancer or employer from a project page. Your messages will appear here.
                            </p>
                            <Link to="/projects" className="btn-primary inline-flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Browse Projects
                            </Link>
                        </div>
                    ) : (
                        /* Conversations List */
                        <div className="space-y-2">
                            {filtered.map((partner, idx) => (
                                <Link
                                    key={partner._id}
                                    to={`/messages/${partner._id}`}
                                    className="group relative block"
                                    style={{ animation: `fadeUp 0.4s ease-out ${Math.min(idx * 0.06, 0.4)}s both` }}
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 to-purple-500/0 rounded-xl blur-lg opacity-0 group-hover:opacity-30 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500" />

                                    <div className="relative flex items-center gap-4 p-4 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 transition-all duration-300 group-hover:border-blue-500/30 group-hover:bg-gray-900/80">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 bg-gradient-to-br ${getGradient(partner.name)} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 group-hover:scale-105 transition-transform duration-300 ring-2 ring-gray-800 group-hover:ring-blue-500/20`}>
                                            {(partner.name || '?').charAt(0)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                                        {partner.name}
                                                    </h3>
                                                    {partner.badge === 'Pro' && (
                                                        <div className="bg-gradient-to-r from-amber-200 to-yellow-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-[0_0_10px_-3px_rgba(251,191,36,0.5)] shrink-0">
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            PRO
                                                        </div>
                                                    )}
                                                    {partner.badge === 'Expert' && (
                                                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-[0_0_10px_-3px_rgba(34,211,238,0.5)] shrink-0">
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                            EXPERT
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-gray-500 text-sm truncate">Tap to view conversation</p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center group-hover:bg-blue-500/10 transition-all duration-300">
                                            <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {searchTerm && filtered.length === 0 && (
                                <div className="text-center py-12" style={{ animation: 'fadeUp 0.4s ease-out' }}>
                                    <p className="text-gray-500">No conversations matching "<span className="text-blue-400">{searchTerm}</span>"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
