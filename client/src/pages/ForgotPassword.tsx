import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), type: 'password_reset' }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage('Verification OTP has been sent to your email. Please check your spam folder if not received.');
                setTimeout(() => {
                    navigate(`/reset-password?email=${encodeURIComponent(email.toLowerCase())}`);
                }, 2000);
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
                        <h2 className="text-2xl font-bold text-white mb-1">Forgot Password</h2>
                        <p className="text-gray-500 text-sm">Enter your email to receive a reset OTP</p>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
                    {message && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                required
                                placeholder="you@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? 'Sending...' : 'Send Reset OTP'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <Link to="/login" className="text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
