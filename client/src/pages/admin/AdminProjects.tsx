import { useEffect, useState } from 'react';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { Trash2, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminProjects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/projects`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchProjects();
    }, [user]);

    const handleDelete = async (projectId: string) => {
        if (!window.confirm("Are you absolutely sure you want to delete this project? This cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE}/admin/projects/${projectId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setProjects(projects.filter(p => p._id !== projectId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Project Management
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 w-64"
                    />
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Project Title</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Budget</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Client</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading projects...</td>
                                </tr>
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No projects found.</td>
                                </tr>
                            ) : (
                                filteredProjects.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-white line-clamp-1">{p.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-300 font-mono">₹{p.budget}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-400">{p.user?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${p.status === 'open' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                                                    p.status === 'awarded' ? 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20' :
                                                        'bg-gray-700 text-gray-400'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/projects/${p._id}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                    title="View Project"
                                                >
                                                    <ExternalLink size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(p._id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
