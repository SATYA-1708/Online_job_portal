import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`${API_BASE}/auth/reset-password-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    otp,
                    newPassword
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage('Password reset successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md p-4 relative z-10">
                <div className="card p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2.5 mb-8">
                            <svg className="w-6 h-6 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" />
                            </svg>
                            <span className="text-[28px] font-black tracking-tight leading-none">
                                <span className="text-white">TECH</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">SPARK</span><span className="text-cyan-300">X</span>
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Reset Password</h2>
                        <p className="text-gray-500 text-sm">Enter the OTP sent to your email</p>
                        <p className="text-xs mt-2 text-emerald-500/70 italic text-center">If you don't see the email, please check your <strong>spam folder</strong>.</p>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
                    {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field opacity-60"
                                required
                                readOnly={!!searchParams.get('email')}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">6-Digit OTP</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-3 text-center text-2xl font-bold tracking-[4px] text-emerald-400 focus:border-emerald-500 focus:outline-none transition-all"
                                placeholder="000000"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field"
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-4"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
