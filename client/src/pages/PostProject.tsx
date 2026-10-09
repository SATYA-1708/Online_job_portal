import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

export const PostProject = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ title, description, budget }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Project posted!');
                navigate('/projects');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error posting project:', error);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12">
            <div className="w-full max-w-2xl px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Post a New Project</h1>
                    <p className="text-gray-500">Describe your project and find the right talent on TECHSPARKX.</p>
                </div>
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Project Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required placeholder="e.g. Build a Modern SaaS Dashboard" />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-40 resize-none" required placeholder="Describe your project in detail..." />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Budget (₹)</label>
                            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="input-field" required placeholder="500" />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full">Cancel</button>
                            <button type="submit" className="btn-primary w-full">Post Project</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
