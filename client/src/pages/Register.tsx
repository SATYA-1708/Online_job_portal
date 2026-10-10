import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_BASE } from '../config';

// Google icon SVG
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Role picker modal shown for new Google users
const RolePicker = ({ onSelect }: { onSelect: (role: 'freelancer' | 'employer') => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center" style={{ animation: 'fadeUp 0.3s ease-out' }}>
            <div className="flex items-center justify-center gap-2.5 mb-5">
                <svg className="w-6 h-6 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" />
                </svg>
                <span className="text-[28px] font-black tracking-tight leading-none">
                    <span className="text-white">TECH</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">SPARK</span><span className="text-cyan-300">X</span>
                </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">One more step</h3>
            <p className="text-gray-400 text-sm mb-6">How do you want to use TECHSPARKX?</p>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onSelect('freelancer')}
                    className="border-2 border-gray-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl p-4 text-center transition-all group"
                >
                    <div className="text-2xl mb-2">💼</div>
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">Find Work</div>
                    <div className="text-xs mt-1 text-gray-500">I'm a freelancer</div>
                </button>
                <button
                    onClick={() => onSelect('employer')}
                    className="border-2 border-gray-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl p-4 text-center transition-all group"
                >
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">Hire Talent</div>
                    <div className="text-xs mt-1 text-gray-500">I'm an employer</div>
                </button>
            </div>
        </div>
    </div>
);

export const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'freelancer' | 'employer'>('freelancer');
    const [phone, setPhone] = useState('');
    const [agreedTerms, setAgreedTerms] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('ref') || '';

    // Google OAuth pending state (for new users needing role)
    const [pendingGoogleCred, setPendingGoogleCred] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setGoogleLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential, referredBy: referralCode || undefined }),
            });
            const data = await res.json();

            if (res.status === 202 && data.needsRole) {
                // New user — show role picker
                setPendingGoogleCred(credentialResponse.credential);
            } else if (res.ok) {
                login(data);
                navigate('/');
            } else {
                setError(data.message || 'Google sign-in failed');
            }
        } catch {
            setError('Google sign-in failed. Try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleRoleSelect = async (selectedRole: 'freelancer' | 'employer') => {
        if (!pendingGoogleCred) return;
        setGoogleLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: pendingGoogleCred, role: selectedRole, referredBy: referralCode || undefined }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data);
                navigate('/');
            } else {
                setError(data.message || 'Account creation failed');
                setPendingGoogleCred(null);
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setPendingGoogleCred(null);
        } finally {
            setGoogleLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError('Google sign-in was cancelled or failed.'),
        flow: 'implicit',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!agreedTerms) { setError('Please agree to the Terms & Conditions'); return; }
        try {
            const payload: Record<string, string> = { name, email, password, role, phone };
            if (referralCode) payload.referredBy = referralCode;

            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, otp }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data);
                navigate('/');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!email) { setError('Please enter your email first'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), type: 'registration' }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
            } else {
                setError(data.message);
            }
        } catch {
            setError('Failed to send OTP. Check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden py-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

            {/* Role picker for new Google users */}
            {pendingGoogleCred && <RolePicker onSelect={handleRoleSelect} />}

            <div className="w-full max-w-md p-4 relative z-10">
                <div className="card p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2.5 mb-6">
                            <svg className="w-6 h-6 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" />
                            </svg>
                            <span className="text-[28px] font-black tracking-tight leading-none">
                                <span className="text-white">TECH</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">SPARK</span><span className="text-cyan-300">X</span>
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
                        <p className="text-gray-500 text-sm">Join the TECHSPARKX community</p>
                    </div>

                    {referralCode && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Referral code <strong>{referralCode}</strong> applied!
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
                    )}

                    {/* Google Sign-Up Button */}
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-sm"
                    >
                        {googleLoading ? (
                            <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : <GoogleIcon />}
                        <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gray-800" />
                        <span className="text-gray-600 text-xs font-medium">or register with email</span>
                        <div className="flex-1 h-px bg-gray-800" />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {!otpSent ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required placeholder="you@example.com" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-3">I want to:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${role === 'freelancer' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}>
                                            <input type="radio" value="freelancer" checked={role === 'freelancer'} onChange={() => setRole('freelancer')} className="hidden" />
                                            <div className="font-bold text-sm">Find Work</div>
                                            <div className="text-xs mt-1 opacity-60">I'm a freelancer</div>
                                        </label>
                                        <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${role === 'employer' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}>
                                            <input type="radio" value="employer" checked={role === 'employer'} onChange={() => setRole('employer')} className="hidden" />
                                            <div className="font-bold text-sm">Hire Talent</div>
                                            <div className="text-xs mt-1 opacity-60">I'm an employer</div>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">Phone Number (optional)</label>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+91 9876543210" />
                                </div>
                                <label className="flex items-start gap-2 cursor-pointer mt-2">
                                    <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-1 accent-emerald-500" />
                                    <span className="text-gray-400 text-xs leading-relaxed">
                                        I agree to the <Link to="/terms" className="text-emerald-400 underline">Terms &amp; Conditions</Link>. I understand that payments are made directly between clients and freelancers.
                                    </span>
                                </label>
                                <button type="button" onClick={handleSendOTP} disabled={!agreedTerms || loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-center text-sm">
                                    OTP sent to <strong>{email}</strong>
                                    <p className="text-xs mt-1 text-emerald-500/70">If not received, please check your <strong>spam folder</strong>.</p>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2 text-center">Enter 6-digit OTP</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-4 text-center text-3xl font-bold tracking-[8px] text-emerald-400 focus:border-emerald-500 focus:outline-none transition-all"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                    {loading ? 'Verifying...' : 'Complete Registration'}
                                </button>
                                <button type="button" onClick={() => setOtpSent(false)} className="w-full text-gray-500 text-sm hover:text-white transition-colors">
                                    Wrong email? Go back
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
