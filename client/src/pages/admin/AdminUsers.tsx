import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Trash2, Search, Eye, ShieldCheck, Coins, X } from 'lucide-react';

export const AdminUsers = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creditValues, setCreditValues] = useState({
        credits: 0,
        referralCredits: 0,
        freePostings: 0,
        freeBids: 0
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filter = params.get('filter');
        if (filter === 'banned') {
            setStatusFilter('banned');
        }
    }, [location]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/users`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchUsers();
    }, [user]);

    const handleBan = async (userId: string) => {
        if (!window.confirm("Are you sure you want to change this user's ban status?")) return;
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchUsers(); // Refresh
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePromote = async (userId: string) => {
        if (!window.confirm("Are you sure you want to promote this user to admin? This action gives them full platform control.")) return;
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/promote`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchUsers(); // Refresh
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm("Are you absolutely sure? This cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u._id !== userId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleManageCredits = (u: any) => {
        setSelectedUser(u);
        setCreditValues({
            credits: u.credits || 0,
            referralCredits: u.referralCredits || 0,
            freePostings: u.freePostings || 0,
            freeBids: u.freeBids || 0
        });
        setIsModalOpen(true);
    };

    const handleUpdateCredits = async () => {
        if (!selectedUser) return;
        setUpdating(true);
        try {
            const res = await fetch(`${API_BASE}/admin/users/${selectedUser._id}/credits`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(creditValues)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setIsModalOpen(false);
                fetchUsers(); // Refresh
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update credits");
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    User Management
                </h1>
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="banned">Suspended Only</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Joined</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Credits</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{u.name}</p>
                                                    <p className="text-sm text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-300 capitalize">{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-gray-400">
                                                <span>Main: {u.credits || 0}</span>
                                                <span>Ref: {u.referralCredits || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${u.status === 'banned' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
                                                'bg-green-400/10 text-green-400 border border-green-400/20'
                                                }`}>
                                                {u.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => window.open(`/profile/${u._id}`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleManageCredits(u)}
                                                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors"
                                                    title="Manage Credits"
                                                >
                                                    <Coins size={18} />
                                                </button>
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePromote(u._id)}
                                                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                            title="Promote to Admin"
                                                        >
                                                            <ShieldCheck size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleBan(u._id)}
                                                            className={`p-2 rounded-lg transition-colors ${u.status === 'banned'
                                                                ? 'text-green-400 hover:bg-green-400/10'
                                                                : 'text-orange-400 hover:bg-orange-400/10'
                                                                }`}
                                                            title={u.status === 'banned' ? "Unban User" : "Ban User"}
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u._id)}
                                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Coins className="text-yellow-400" size={24} />
                                Manage Credits
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                                <p className="text-sm text-indigo-300 font-medium">User: {selectedUser?.name}</p>
                                <p className="text-xs text-indigo-400">{selectedUser?.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage Credits</label>
                                    <input
                                        type="number"
                                        value={creditValues.credits}
                                        onChange={(e) => setCreditValues({ ...creditValues, credits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Credits</label>
                                    <input
                                        type="number"
                                        value={creditValues.referralCredits}
                                        onChange={(e) => setCreditValues({ ...creditValues, referralCredits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Free Postings</label>
                                    <input
                                        type="number"
                                        value={creditValues.freePostings}
                                        onChange={(e) => setCreditValues({ ...creditValues, freePostings: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Free Bids</label>
                                    <input
                                        type="number"
                                        value={creditValues.freeBids}
                                        onChange={(e) => setCreditValues({ ...creditValues, freeBids: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateCredits}
                                disabled={updating}
                                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${updating
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/20'
                                    }`}
                            >
                                {updating ? 'Updating...' : 'Update Credits'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
