import React, { useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../hooks/useAuth';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    agreementId: string;
    revieweeName: string;
    onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, agreementId, revieweeName, onSuccess }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please provide a rating out of 5 stars.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                    contractId: agreementId,
                    rating,
                    comment,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch (err) {
            setError('Network error submitting review.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl" style={{ animation: 'fadeUp 0.3s ease-out' }}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-amber-400">⭐</span> Leave a Review
                        </h3>
                        <button onClick={onClose} className="text-gray-600 hover:text-white text-xl leading-none">×</button>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        How was your experience working with <span className="text-white font-semibold">{revieweeName}</span>?
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex justify-center mb-6">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <svg
                                            className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-gray-700'
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment Textarea */}
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2">
                                Public Review <span className="text-gray-600 text-xs font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="input-field h-32 resize-none text-sm"
                                placeholder="Share details of your experience..."
                                maxLength={500}
                            />
                            <div className="text-right mt-1 text-xs text-gray-600">
                                {comment.length}/500
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 btn-secondary !py-3 text-sm">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || rating === 0}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-3 rounded-lg text-sm hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                            >
                                {loading ? 'Submitting...' : 'Post Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
