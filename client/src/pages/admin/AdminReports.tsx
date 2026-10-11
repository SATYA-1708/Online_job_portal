import { useEffect, useState } from 'react';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { AlertTriangle, CheckCircle, ShieldOff, Trash2, Link as LinkIcon } from 'lucide-react';

export const AdminReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/reports`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchReports();
    }, [user]);

    const handleAction = async (reportId: string, actionCategory: string) => {
        if (!window.confirm(`Mark report as ${actionCategory}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ action: actionCategory })
            });
            if (res.ok) {
                fetchReports();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Reports & Abuse Control
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col hidden sm:flex">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Type</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Reason</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Reporter</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Target ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading reports...</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No reports found.</td>
                                </tr>
                            ) : (
                                reports.map((r) => (
                                    <tr key={r._id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-white capitalize font-medium">{r.reportedType}</span>
                                            <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-300 line-clamp-2 max-w-xs">{r.reason}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-400 text-sm">{r.reporterName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                                                {r.reportedId.slice(-6)} <LinkIcon size={12} />
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${r.status === 'pending' ? 'bg-yellow-400/10 text-yellow-500 border border-yellow-400/20' :
                                                    r.status === 'ignored' ? 'bg-gray-700/50 text-gray-400 border border-gray-600' :
                                                        'bg-green-400/10 text-green-400 border border-green-400/20'
                                                }`}>
                                                {r.status === 'resolved' && r.adminAction ? r.adminAction : r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {r.status === 'pending' ? (
                                                <div className="flex justify-end gap-2 isolate">
                                                    <button
                                                        onClick={() => handleAction(r._id, 'ignored')}
                                                        title="Ignore Report"
                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(r._id, 'warned')}
                                                        title="Warn User"
                                                        className="p-1.5 text-orange-400 hover:bg-orange-400/10 rounded transition-colors"
                                                    >
                                                        <AlertTriangle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(r._id, 'suspended')}
                                                        title="Suspend User"
                                                        className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    >
                                                        <ShieldOff size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(r._id, 'deleted')}
                                                        title="Delete Content"
                                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Mobile view omitted for brevity, focusing on dashboard desktop view */}
        </div>
    );
};
