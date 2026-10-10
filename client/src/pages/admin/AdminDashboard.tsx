import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { Users, UserPlus, Briefcase, CheckCircle, AlertTriangle, Activity, Zap, Ban, Settings, Coins } from 'lucide-react';

interface ActivityLog {
    _id: string;
    userName: string;
    action: string;
    details: string;
    createdAt: string;
}

export const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsers: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingReports: 0
    });
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/stats`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchActivityLogs = async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/activity`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setActivityLogs(data);
                }
            } catch (error) {
                console.error("Failed to fetch activity logs", error);
            }
        };

        if (user?.token) {
            fetchStats();
            fetchActivityLogs();
        }
    }, [user]);

    const getActivityIcon = (action: string) => {
        if (action.includes('register')) return <UserPlus size={16} className="text-green-400" />;
        if (action.includes('project')) return <Briefcase size={16} className="text-indigo-400" />;
        if (action.includes('contract')) return <CheckCircle size={16} className="text-emerald-400" />;
        if (action.includes('ban') || action.includes('delete')) return <Ban size={16} className="text-red-400" />;
        if (action.includes('setting')) return <Settings size={16} className="text-gray-400" />;
        return <Zap size={16} className="text-amber-400" />;
    };

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'New Users Today', value: stats.newUsers, icon: UserPlus, color: 'text-green-400', bg: 'bg-green-400/10' },
        { title: 'Total Projects', value: stats.totalProjects, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { title: 'Active Jobs', value: stats.activeProjects, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { title: 'Completed Projects', value: stats.completedProjects, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { title: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
    ];

    if (loading) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-800 rounded w-3/4"></div></div></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-8">
                Platform Overview
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Icon size={100} className={card.color} />
                            </div>
                            <div className={`p-3 rounded-lg ${card.bg} w-fit mb-4`}>
                                <Icon size={24} className={card.color} />
                            </div>
                            <div>
                                <h3 className="text-gray-400 font-medium text-sm">{card.title}</h3>
                                <div className="text-4xl font-bold text-white mt-1">{card.value}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col h-[400px]">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="text-emerald-400" size={20} />
                        Global Activity Feed
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {activityLogs.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-800 rounded-lg">
                                No recent activity
                            </div>
                        ) : (
                            activityLogs.map((log) => (
                                <div key={log._id} className="flex gap-4 p-3 bg-gray-800/30 rounded-lg border border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                                    <div className="mt-1 bg-gray-800 p-2 rounded-full shrink-0 h-fit">
                                        {getActivityIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200">
                                            <span className="font-bold text-white">{log.userName}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{log.details}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                                            {new Date(log.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/admin/reports')}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-3 rounded-lg transition-colors flex items-center shadow-md"
                        >
                            <AlertTriangle className="mr-3 text-red-400" size={18} />
                            <span>Review Pending Reports</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/users?filter=banned')}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-3 rounded-lg transition-colors flex items-center shadow-md"
                        >
                            <Users className="mr-3 text-blue-400" size={18} />
                            <span>Manage Suspended Users</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/users?action=manageCredits')}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-3 rounded-lg transition-colors flex items-center shadow-md border border-yellow-500/20"
                        >
                            <Coins className="mr-3 text-yellow-400" size={18} />
                            <span>Manage User Credits</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
