import { useEffect, useState } from 'react';
import { API_BASE } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { Settings2, Save } from 'lucide-react';

export const AdminSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        platformName: '',
        defaultNewUserCredits: 3,
        referralBonusCredits: 1,
        maintenanceMode: false,
        contactEmail: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE}/admin/settings`, {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        platformName: data.platformName || '',
                        defaultNewUserCredits: data.defaultNewUserCredits !== undefined ? data.defaultNewUserCredits : 3,
                        referralBonusCredits: data.referralBonusCredits !== undefined ? data.referralBonusCredits : 1,
                        maintenanceMode: data.maintenanceMode || false,
                        contactEmail: data.contactEmail || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchSettings();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    ...settings,
                    defaultNewUserCredits: Number(settings.defaultNewUserCredits),
                    referralBonusCredits: Number(settings.referralBonusCredits)
                })
            });
            if (res.ok) {
                alert('Settings correctly updated.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-gray-500 p-8">Loading configuration...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
                <Settings2 size={32} className="text-indigo-400" />
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Platform Settings
                </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
                            <input
                                type="text"
                                name="platformName"
                                value={settings.platformName}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Default Free Credits (New Users)</label>
                            <input
                                type="number"
                                name="defaultNewUserCredits"
                                value={settings.defaultNewUserCredits}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Referral Bonus (Credits per invite)</label>
                            <input
                                type="number"
                                name="referralBonusCredits"
                                value={settings.referralBonusCredits}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700 border-l-4 border-l-red-500">
                            <div>
                                <h3 className="text-white font-medium">Maintenance Mode</h3>
                                <p className="text-sm text-gray-400">Put the site strictly into maintenance (users cannot log in)</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
