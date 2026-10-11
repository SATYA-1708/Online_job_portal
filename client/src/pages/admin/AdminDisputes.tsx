import { useEffect, useState } from 'react';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { AlertTriangle, CheckCircle, Shield, Ban } from 'lucide-react';

export const AdminDisputes = () => {
    const { user } = useAuth();
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const fetchDisputes = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/disputes`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDisputes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchDisputes();
    }, [user]);

    const handleResolve = async (contractId: string, outcome: string) => {
        if (!window.confirm("Are you sure you want to enforce this resolution? This action is permanent and binding.")) return;

        setResolvingId(contractId);
        try {
            const res = await fetch(`${API_BASE}/admin/disputes/${contractId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ outcome })
            });

            if (res.ok) {
                setDisputes(prev => prev.filter(c => c._id !== contractId));
            } else {
                const data = await res.json();
                alert(data.message || 'Error resolving dispute');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Dispute Resolution Center
                    </h1>
                    <p className="text-gray-400 mt-1">Review locked contracts and arbitrate resolutions.</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={20} />
                    <span className="text-white font-bold">{disputes.length}</span>
                    <span className="text-gray-500 text-sm">Active Disputes</span>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4 pt-4"><div className="h-10 bg-gray-800 rounded w-1/4"></div><div className="h-64 bg-gray-900 rounded-xl border border-gray-800"></div></div>
            ) : disputes.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
                    <Shield className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Platform is Secure</h3>
                    <p className="text-gray-500">There are no active contract disputes at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {disputes.map(contract => (
                        <div key={contract._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{contract.projectTitle}</h3>
                                        <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded">
                                            DISPUTED
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Contract ID: {contract._id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-400">₹{contract.amount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">Total Value</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">The Parties</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-gray-950 p-4 rounded-lg border border-gray-800">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                                C
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Client / Employer</p>
                                                <p className="text-white font-bold">{contract.employerName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center text-gray-600">
                                            <svg className="w-5 h-5 mx-0 my-auto transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-950 p-4 rounded-lg border border-gray-800">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                                                F
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Freelancer</p>
                                                <p className="text-white font-bold">{contract.freelancerName}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Milestone Status</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {contract.milestones.map((m: any, idx: number) => (
                                            <div key={idx} className="bg-gray-950 border border-gray-800 p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-300">{m.title}</p>
                                                    <p className="text-xs text-emerald-400 mt-0.5">₹{m.amount.toLocaleString()}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${m.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        m.status === 'paid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-gray-800 text-gray-400'
                                                    }`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-950 p-6 border-t border-gray-800">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Admin Ruling</h4>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleResolve(contract._id, 'refund_employer')}
                                        disabled={resolvingId === contract._id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-white px-4 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                                    >
                                        <Ban size={18} />
                                        Rule for Client (Refund / Cancel)
                                    </button>
                                    <button
                                        onClick={() => handleResolve(contract._id, 'pay_freelancer')}
                                        disabled={resolvingId === contract._id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-400 hover:text-white px-4 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} />
                                        Rule for Freelancer (Force Complete)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
