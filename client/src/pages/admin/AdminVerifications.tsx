import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE } from '../../config';
import { CheckCircle, XCircle, Shield, FileText } from 'lucide-react';

interface VerificationRequest {
    _id: string;
    userId: string;
    userName: string;
    documentType: string;
    documentImage: string;
    status: string;
    createdAt: string;
}

// Ensure the SERVER_BASE URL is used for images since API_BASE includes `/api`
const SERVER_BASE = API_BASE.replace(/\/api$/, '');

export const AdminVerifications = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_BASE}/verification/pending`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: string, action: 'approve' | 'reject') => {
        setResolvingId(id);
        const reason = action === 'reject' ? prompt('Please provide a rejection reason (optional):') : '';

        try {
            const res = await fetch(`${API_BASE}/verification/${id}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ action, reason })
            });

            if (res.ok) {
                setRequests(prev => prev.filter(req => req._id !== id));
            } else {
                alert('Failed to resolve request');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setResolvingId(null);
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4 pt-4"><div className="h-10 bg-gray-800 rounded w-1/4"></div><div className="h-64 bg-gray-900 rounded-xl border border-gray-800"></div></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Identity Verifications
                    </h1>
                    <p className="text-gray-400 mt-1">Review and approve user KYC documents to grant them a verified badge.</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Shield className="text-blue-400" size={20} />
                    <span className="text-white font-bold">{requests.length}</span>
                    <span className="text-gray-400 text-sm">Pending</span>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
                    <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">There are no pending identity verification requests to review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {requests.map(req => (
                        <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{req.userName}</h3>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                        <FileText size={12} />
                                        {req.documentType} · Submitted {new Date(req.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    PENDING
                                </div>
                            </div>

                            <div className="p-4 bg-gray-950 flex-1 flex justify-center items-center relative group">
                                <a href={`${SERVER_BASE}/uploads/${req.documentImage}`} target="_blank" rel="noreferrer" className="block w-full h-full text-center">
                                    <img
                                        src={`${SERVER_BASE}/uploads/${req.documentImage}`}
                                        alt={`${req.documentType} for ${req.userName}`}
                                        className="max-h-64 mx-auto rounded-lg object-contain group-hover:opacity-75 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="bg-gray-900/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">Click to Enlarge</span>
                                    </div>
                                </a>
                            </div>

                            <div className="p-4 border-t border-gray-800 grid grid-cols-2 gap-3 bg-gray-800/20">
                                <button
                                    onClick={() => handleResolve(req._id, 'reject')}
                                    disabled={resolvingId === req._id}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 disabled:opacity-50"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleResolve(req._id, 'approve')}
                                    disabled={resolvingId === req._id}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20 disabled:opacity-50"
                                >
                                    <CheckCircle size={18} />
                                    Approve Document
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
