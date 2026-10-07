import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    AlertTriangle,
    Settings,
    LogOut,
    ShieldCheck,
    Scale,
    Coins
} from 'lucide-react';

export const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/users?action=manageCredits', icon: Coins, label: 'Manage Credits' },
        { path: '/admin/projects', icon: Briefcase, label: 'Projects' },
        { path: '/admin/reports', icon: AlertTriangle, label: 'Reports' },
        { path: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
        { path: '/admin/disputes', icon: Scale, label: 'Disputes' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                    </h2>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center space-x-3 mb-6 px-2">
                        <div className="bg-indigo-600 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-indigo-400/30">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
