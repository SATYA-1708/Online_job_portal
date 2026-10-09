import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useParams, Link } from 'react-router-dom';
import { ReportModal } from '../components/ReportModal';
import { VerificationModal } from '../components/VerificationModal';
import { SEO } from '../components/SEO';

import { SERVER_BASE, API_BASE } from '../config';
const API_URL = SERVER_BASE;

interface Review {
    _id: string;
    projectTitle: string;
    reviewerName: string;
    rating: number;
    comment: string;
    amount: number;
    createdAt: string;
}

export const ProfilePage = () => {
    const { user, login } = useAuth();
    const { id } = useParams<{ id: string }>();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [experience, setExperience] = useState('');
    const [phone, setPhone] = useState('');
    const [upiId, setUpiId] = useState('');
    const [aadhaarLast4, setAadhaarLast4] = useState('');
    const [uploadingQr, setUploadingQr] = useState(false);
    const qrInputRef = useRef<HTMLInputElement>(null);

    const isOwnProfile = !id || (user && user._id === id);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    useEffect(() => { fetchProfile(); fetchReviews(); }, [id, user]);

    const fetchReviews = async () => {
        const userId = id || (user ? user._id : null);
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE}/reviews/${userId}`);
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setReviews(data);
        } catch (err) { console.error('Error fetching reviews:', err); }
    };

    const fetchProfile = async () => {
        try {
            const userId = id || (user ? user._id : null);
            if (!userId) return;
            const response = await fetch(`${API_URL}/api/auth/${userId}`);
            const data = await response.json();
            if (response.ok) {
                setProfileData(data);
                setName(data.name);
                setBio(data.bio || '');
                setSkills(data.skills ? data.skills.join(', ') : '');
                setHourlyRate(data.hourlyRate || '');
                setExperience(data.experience || '');
                setPhone(data.phone || '');
                setUpiId(data.upiId || '');
                setAadhaarLast4(data.aadhaarLast4 || '');
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        }
    };



    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ name, bio, skills: skills.split(',').map(s => s.trim()).filter(s => s), hourlyRate: Number(hourlyRate), experience, phone, upiId, aadhaarLast4 }),
            });
            const data = await response.json();
            if (response.ok) {
                login(data);
                setProfileData(data);
                setIsEditing(false);
            } else { alert(data.message); }
        } catch (error) { console.error('Error updating profile:', error); }
    };

    const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
        if (!user) return;
        const setter = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
        setter(true);
        try {
            const formData = new FormData();
            formData.append(type, file);
            const endpoint = type === 'avatar' ? 'upload-avatar' : 'upload-cover';
            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData,
            });
            if (response.ok) {
                fetchProfile();
            } else {
                const data = await response.json();
                alert(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setter(false);
        }
    };

    if (!profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center" style={{ animation: 'fadeUp 0.5s ease-out' }}>
                    <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
                    <p className="text-gray-500 mt-4">Loading profile…</p>
                </div>
            </div>
        );
    }

    const avatarUrl = profileData.avatar ? `${API_URL}${profileData.avatar}` : null;
    const coverUrl = profileData.coverImage ? `${API_URL}${profileData.coverImage}` : null;

    return (
        <div className="min-h-screen">
            <SEO
                title={`${profileData.name} - ${profileData.role === 'freelancer' ? 'Professional Freelancer' : 'Hiring Expert'}`}
                description={`${profileData.name} is a ${profileData.role} on TECHSPARKX. ${profileData.bio ? profileData.bio.slice(0, 150) : 'Connect and collaborate on premium projects.'}`}
            />
            {/* Cover Section */}
            <div className="relative">
                <div
                    className="h-56 md:h-72 w-full bg-cover bg-center relative"
                    style={{
                        backgroundImage: coverUrl
                            ? `url(${coverUrl})`
                            : 'linear-gradient(135deg, #059669 0%, #0891b2 50%, #6366f1 100%)',
                    }}
                >
                    {/* Cover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-gray-950" />

                    {/* Decorative mesh */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)'
                    }} />

                    {isOwnProfile && (
                        <>
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'cover'); }}
                            />
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-black/60 transition-all flex items-center gap-2 border border-white/10"
                                disabled={uploadingCover}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {uploadingCover ? 'Uploading…' : 'Edit Cover'}
                            </button>
                        </>
                    )}
                </div>

                {/* Profile Info Overlay */}
                <div className="container mx-auto px-4 relative" style={{ marginTop: '-80px' }}>
                    <div className="max-w-4xl mx-auto" style={{ animation: 'fadeUp 0.6s ease-out' }}>
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
                            {/* Avatar */}
                            <div className="relative group z-10">
                                <div className="w-32 h-32 rounded-2xl border-4 border-gray-950 shadow-2xl overflow-hidden bg-gray-800 ring-4 ring-gray-900/50">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={profileData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-5xl font-black text-white">
                                            {profileData.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                {isOwnProfile && (
                                    <>
                                        <input
                                            type="file"
                                            ref={avatarInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'avatar'); }}
                                        />
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                                            disabled={uploadingAvatar}
                                        >
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                {/* Online indicator */}
                                <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-950" />
                            </div>

                            {/* Name & Meta */}
                            <div className="flex-1 text-center md:text-left pb-2">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-3xl font-black text-white tracking-tight">{profileData.name}</h1>
                                    {profileData.badge === 'Pro' && (
                                        <div className="bg-gradient-to-r from-amber-200 to-yellow-400 text-gray-950 text-xs font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-[0_0_15px_-3px_rgba(251,191,36,0.5)] transform translate-y-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            PRO
                                        </div>
                                    )}
                                    {profileData.badge === 'Expert' && (
                                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-gray-950 text-xs font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-[0_0_15px_-3px_rgba(34,211,238,0.5)] transform translate-y-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            EXPERT
                                        </div>
                                    )}
                                    {profileData.badgeSubscriptionEnd && (
                                        <div className="text-gray-500 text-xs mt-1 ml-2 self-end pb-1">
                                            Valid until {new Date(profileData.badgeSubscriptionEnd).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
                                    <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 capitalize">
                                        {profileData.role}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Available for hire
                                    </span>
                                    {profileData.hourlyRate && (
                                        <span className="text-emerald-400 font-bold text-sm">₹{profileData.hourlyRate}/hr</span>
                                    )}
                                    {/* Average Rating */}
                                    {reviews.length > 0 && (
                                        <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                                            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            <span className="text-amber-400 font-bold text-sm">
                                                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                                            </span>
                                            <span className="text-gray-500 text-xs">({reviews.length})</span>
                                        </span>
                                    )}
                                </div>
                                {/* Verification Badges */}
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                                    {profileData.isEmailVerified && (
                                        <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                                            ✓ Email
                                        </span>
                                    )}
                                    {profileData.isPhoneVerified && (
                                        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            ✓ Phone
                                        </span>
                                    )}
                                    {profileData.isAadhaarVerified && (
                                        <span className="flex items-center gap-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/20">
                                            ✓ Aadhaar
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pb-2">
                                {!isOwnProfile && user && (
                                    <>
                                        <Link to={`/messages/${id}`} className="btn-primary !py-2.5 !px-5 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Message
                                        </Link>
                                        <button
                                            onClick={() => setIsReportModalOpen(true)}
                                            className="btn-secondary text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 !py-2.5 !px-5 text-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                            Report
                                        </button>
                                    </>
                                )}
                                {isOwnProfile && !isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="btn-secondary !py-2.5 !px-5 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Profile
                                    </button>
                                )}
                                {isOwnProfile && !profileData.isAadhaarVerified && (
                                    <button
                                        onClick={() => setIsVerificationModalOpen(true)}
                                        className="font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600 hover:text-white"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Verify Identity
                                    </button>
                                )}
                                {isOwnProfile && (
                                    <Link
                                        to="/membership"
                                        className={`font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 ${profileData.badge
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-gray-950 shadow-amber-500/20'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {profileData.badge ? 'Manage Membership' : 'Get Verified'}
                                    </Link>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Sidebar */}
                        <div className="space-y-4" style={{ animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
                            {/* Details Card */}
                            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-5">
                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Hourly Rate</p>
                                            <p className="font-bold text-emerald-400">{profileData.hourlyRate ? `₹${profileData.hourlyRate}/hr` : 'Negotiable'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Experience</p>
                                            <p className="font-medium text-gray-300 text-sm">{profileData.experience || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    {isOwnProfile && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Email</p>
                                                <p className="font-medium text-gray-300 text-sm truncate">{profileData.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Role</p>
                                            <p className="font-medium text-gray-300 text-sm capitalize">{profileData.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Card */}
                            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-5">
                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profileData.skills && profileData.skills.length > 0 ? (
                                        profileData.skills.map((skill: string, index: number) => (
                                            <span
                                                key={index}
                                                className="bg-gray-800/80 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700/50 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors cursor-default"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 italic text-sm">No skills listed yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Info Card (public) */}
                            {(profileData.upiId || profileData.qrImage) && (
                                <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-5">
                                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">💳 Payment Details</h3>
                                    {profileData.upiId && (
                                        <div className="mb-3">
                                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">UPI ID</p>
                                            <p className="font-mono text-emerald-400 text-sm mt-1 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 inline-block">{profileData.upiId}</p>
                                        </div>
                                    )}
                                    {profileData.qrImage && (
                                        <div>
                                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-2">QR Code</p>
                                            <img src={`${API_URL}${profileData.qrImage}`} alt="Payment QR" className="w-32 h-32 rounded-lg border border-gray-700 bg-white object-contain" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-2" style={{ animation: 'fadeUp 0.5s ease-out 0.2s both' }}>
                            {isEditing ? (
                                <form onSubmit={handleUpdate} className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-6 space-y-5">
                                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Display Name</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Hourly Rate (₹)</label>
                                            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="input-field" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Experience</label>
                                            <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field" placeholder="e.g. 3 years, Senior, Entry-level" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Bio</label>
                                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input-field h-32 resize-none" placeholder="Tell clients about yourself…" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Skills (comma separated)</label>
                                        <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className="input-field" placeholder="React, Node.js, Design" />
                                    </div>

                                    {/* Payment & Verification Section */}
                                    <div className="border-t border-gray-800 pt-5 mt-2">
                                        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">💳 Payment & Verification</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">UPI ID</label>
                                                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="input-field" placeholder="yourname@upi" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+91 9876543210" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Aadhaar (Last 4 Digits)</label>
                                                <input type="text" value={aadhaarLast4} onChange={(e) => setAadhaarLast4(e.target.value.slice(0, 4))} className="input-field" placeholder="XXXX" maxLength={4} />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">QR Code Image</label>
                                                <input
                                                    type="file"
                                                    ref={qrInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        if (!e.target.files?.[0] || !user) return;
                                                        setUploadingQr(true);
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('qr', e.target.files[0]);
                                                            const res = await fetch(`${API_URL}/api/auth/upload-qr`, {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${user.token}` },
                                                                body: formData,
                                                            });
                                                            if (res.ok) fetchProfile();
                                                        } catch (err) { console.error('QR upload error:', err); }
                                                        finally { setUploadingQr(false); }
                                                    }}
                                                />
                                                <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr} className="btn-secondary text-xs w-full">
                                                    {uploadingQr ? 'Uploading...' : profileData.qrImage ? '📷 Change QR' : '📷 Upload QR'}
                                                </button>
                                                {profileData.qrImage && (
                                                    <img src={`${API_URL}${profileData.qrImage}`} alt="QR" className="w-20 h-20 mt-2 rounded-lg border border-gray-700 bg-white object-contain" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                        <button type="submit" className="btn-primary flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    {/* About */}
                                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <h2 className="text-lg font-bold text-white">About</h2>
                                        </div>
                                        <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                                            {profileData.bio || <span className="italic text-gray-600">No bio provided yet. {isOwnProfile && 'Click "Edit Profile" to add one.'}</span>}
                                        </p>
                                    </div>

                                    {/* Quick Actions (own profile) */}
                                    {isOwnProfile && (
                                        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Link to="/my-projects" className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-emerald-500/30 transition-all group text-center">
                                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">My Projects</p>
                                                </Link>
                                                <Link to="/inbox" className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/30 transition-all group text-center">
                                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <p className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">Messages</p>
                                                </Link>
                                                <Link to="/contract" className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-amber-500/30 transition-all group text-center">
                                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">Payments</p>
                                                </Link>
                                                <Link to="/projects" className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-violet-500/30 transition-all group text-center">
                                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-violet-400 transition-colors mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-gray-300 text-xs font-semibold group-hover:text-white transition-colors">Browse Jobs</p>
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Work History & Reviews */}
                                    {reviews.length > 0 && (
                                        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/80 p-6">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                </div>
                                                <h2 className="text-lg font-bold text-white">Work History & Reviews</h2>
                                                <span className="ml-auto text-gray-500 text-sm">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="space-y-4">
                                                {reviews.map((review) => (
                                                    <div key={review._id} className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="min-w-0">
                                                                <h4 className="text-white font-semibold text-sm truncate">{review.projectTitle}</h4>
                                                                <p className="text-gray-500 text-xs">by {review.reviewerName} · {new Date(review.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-gray-400 text-sm leading-relaxed mt-2">"{review.comment}"</p>
                                                        )}
                                                        {review.amount > 0 && (
                                                            <p className="text-emerald-400/60 text-xs font-semibold mt-2">₹{review.amount} project</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {profileData && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedId={profileData._id}
                    reportedType="user"
                />
            )}

            {/* Verification Modal */}
            <VerificationModal
                isOpen={isVerificationModalOpen}
                onClose={() => {
                    setIsVerificationModalOpen(false);
                    fetchProfile();
                }}
            />
        </div>
    );
};
