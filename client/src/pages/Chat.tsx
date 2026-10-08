import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';


interface FileInfo {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    file?: FileInfo;
}

import { SERVER_BASE } from '../config';
const API_URL = SERVER_BASE;

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const Chat = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [partnerData, setPartnerData] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [calling, setCalling] = useState<'voice' | 'video' | null>(null);
    const [incomingCall, setIncomingCall] = useState<{ fromId: string, fromName: string, type: 'voice' | 'video' } | null>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [primaryView, setPrimaryView] = useState<'remote' | 'local'>('remote');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevMessageCountRef = useRef(0);
    const isUserNearBottomRef = useRef(true);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const ringtoneRef = useRef<{ stop: () => void } | null>(null);
    const setupInProgress = useRef(false);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
        ]
    };

    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

    const fetchPartnerProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/${userId}`);
            const data = await response.json();
            setPartnerData(data);
        } catch (error) { console.error(error); }
    };

    const fetchMessages = async () => {
        if (!user || !userId) return;
        try {
            const response = await fetch(`${API_URL}/api/messages/${userId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setMessages(data);
            } else {
                console.error('Failed to fetch messages:', data);
            }
        } catch (error) { console.error('Error fetching messages:', error); }
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    const cleanupCall = () => {
        ringtoneRef.current?.stop();
        localStream?.getTracks().forEach(track => track.stop());
        remoteStream?.getTracks().forEach(track => track.stop());
        peerConnection.current?.close();
        peerConnection.current = null;
        pendingCandidates.current = [];
        setLocalStream(null);
        setRemoteStream(null);
        setCalling(null);
        setIncomingCall(null);
        setCallAccepted(false);
    };

    const setupWebRTC = async (isCaller: boolean, forceType?: 'voice' | 'video') => {
        try {
            if (setupInProgress.current) {
                console.log('[Chat] setupWebRTC already in progress, skipping');
                return;
            }
            setupInProgress.current = true;

            const activeType = forceType || calling || (window as any)._answeringData?.type || incomingCall?.type;
            const isVideo = activeType === 'video';

            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo ? {
                    facingMode: 'user',
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 }
                } : false,
                audio: true
            });

            setLocalStream(stream);
            const pc = new RTCPeerConnection(iceServers);
            peerConnection.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    socket.emit('webrtc_signal', {
                        to: userId || incomingCall?.fromId,
                        signal: { candidate: event.candidate }
                    });
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    remoteVideoRef.current.muted = false;
                    remoteVideoRef.current.volume = 1.0;
                    remoteVideoRef.current.play().catch(e => console.error('[Chat] Auto-play failed:', e));
                }
            };

            if (isCaller && socket) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('webrtc_signal', { to: userId, signal: offer });
            }
            setupInProgress.current = false;
        } catch (err) {
            setupInProgress.current = false;
            console.error('WebRTC Setup Error:', err);
            cleanupCall();
        }
    };

    useEffect(() => {
        if (userId) {
            fetchMessages();
            fetchPartnerProfile();
        }
    }, [userId, user]);

    const playRingtone = (isOutgoing: boolean) => {
        if (ringtoneRef.current) ringtoneRef.current.stop();

        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            let isStopped = false;

            const playPulse = (freq: number, duration: number, delay: number) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

                gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
                gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + delay + 0.1);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + delay + duration);

                osc.start(audioCtx.currentTime + delay);
                osc.stop(audioCtx.currentTime + delay + duration);
            };

            const interval = setInterval(() => {
                if (isStopped) return;
                if (isOutgoing) {
                    // Outgoing "tink-tink" sound
                    playPulse(440, 0.5, 0);
                    playPulse(440, 0.5, 0.6);
                } else {
                    // Incoming "ring-ring" sound
                    playPulse(554.37, 0.8, 0); // Db5
                    playPulse(440, 0.8, 0.1);    // A4
                }
            }, 2000);

            ringtoneRef.current = {
                stop: () => {
                    isStopped = true;
                    clearInterval(interval);
                    audioCtx.close();
                    ringtoneRef.current = null;
                }
            };
        } catch (e) {
            console.error('Ringtone fail:', e);
        }
    };

    useEffect(() => {
        if (socket) {
            // Tell the socket server we are focusing this specific chat
            if (userId) socket.emit('join_chat', userId);

            const handleReceiveMessage = (messageObj: Message) => {
                // Only append if it belongs to the current open chat
                if (messageObj.senderId === userId || messageObj.receiverId === userId) {
                    setMessages(prev => [...prev, messageObj]);
                    isUserNearBottomRef.current = true; // Auto-scroll for new incoming
                }
            };

            socket.on('receive_message', handleReceiveMessage);

            // REMOVED handleIncomingCall from here to prevent duplicate ringing.
            // Navbar.tsx handles all incoming call signals globally.

            const handleCallAnswered = async (data: { accepted: boolean }) => {
                console.log('[Chat] Call answered event received:', data);
                ringtoneRef.current?.stop();
                if (data.accepted) {
                    setCallAccepted(true);
                    // Pass current calling type to setup
                    await setupWebRTC(true, calling as any);
                } else {
                    setCalling(null);
                    alert("Call declined");
                }
            };

            const handleCallEnded = () => {
                cleanupCall();
            };

            const handleWebRTCSignal = async (data: { fromId: string, signal: any }) => {
                if (!socket) return;
                if (!peerConnection.current) await setupWebRTC(false);

                const { signal } = data;
                const pc = peerConnection.current;
                if (!pc) return;

                if (signal.type === 'offer') {
                    console.log('[Chat] Received offer');
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('webrtc_signal', { to: data.fromId, signal: answer });

                    // Process buffered candidates
                    while (pendingCandidates.current.length > 0) {
                        const cand = pendingCandidates.current.shift();
                        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                    }
                } else if (signal.type === 'answer') {
                    console.log('[Chat] Received answer');
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));

                    // Process buffered candidates
                    while (pendingCandidates.current.length > 0) {
                        const cand = pendingCandidates.current.shift();
                        if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
                    }
                } else if (signal.candidate) {
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } else {
                        console.log('[Chat] Buffering candidate');
                        pendingCandidates.current.push(signal.candidate);
                    }
                }
            };

            socket.on('receive_message', handleReceiveMessage);
            // socket.on('incoming_call', handleIncomingCall); // REMOVED
            socket.on('call_answered', handleCallAnswered);
            socket.on('call_ended', handleCallEnded);
            socket.on('webrtc_signal', handleWebRTCSignal);

            // AUTO-ANSWER BRIDGE: If we navigated here because we accepted a call in the Navbar/Fallback
            if ((window as any)._isanswering) {
                const data = (window as any)._answeringData;
                (window as any)._isanswering = false;

                if (data) {
                    console.log('[Chat] Auto-answering call bridge for:', data);
                    setIncomingCall(data);
                    setCalling(data.type);
                    setCallAccepted(true);

                    // Stop any potential local ringing
                    ringtoneRef.current?.stop();

                    // MUST signal back that we are ready to receive the offer
                    // Move this here from Navbar to ensure listeners are ready
                    socket.emit('answer_call', { to: userId, accepted: true });

                    // Longer delay to ensure Video elements are rendered in DOM before setup
                    setTimeout(() => {
                        console.log('[Chat] Triggering synchronized setupWebRTC');
                        setupWebRTC(false, data.type);
                    }, 1500);
                }
            }

            return () => {
                socket.off('receive_message', handleReceiveMessage);
                // socket.off('incoming_call', handleIncomingCall); // REMOVED
                socket.off('call_answered', handleCallAnswered);
                socket.off('call_ended', handleCallEnded);
                socket.off('webrtc_signal', handleWebRTCSignal);
                cleanupCall();
            };
        }
    }, [socket, userId]);

    // Ensure streams are actually assigned to video elements when they change
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log('[Chat] Assigning local stream to video');
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, calling]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log('[Chat] Assigning remote stream to video');
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.error('[Chat] Remote play failed:', e));
        }
    }, [remoteStream, calling]);

    // Messaging hooks and logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        isUserNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }, []);

    useEffect(() => {
        const isNewMessage = messages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (isNewMessage && isUserNearBottomRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || (!newMessage.trim() && !selectedFile)) return;

        // Force scroll to bottom when user sends a message
        isUserNearBottomRef.current = true;

        setUploading(true);
        try {
            let body;
            let headers: Record<string, string> = { 'Authorization': `Bearer ${user.token}` };

            if (selectedFile) {
                const formData = new FormData();
                formData.append('receiverId', userId!);
                if (newMessage.trim()) formData.append('content', newMessage);
                formData.append('file', selectedFile);
                body = formData;
            } else {
                body = JSON.stringify({
                    receiverId: userId,
                    content: newMessage
                });
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers,
                body,
            });

            if (response.ok) {
                const responseData = await response.json();
                setNewMessage('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Immediately append to our own UI
                setMessages(prev => [...prev, responseData]);

                // Emit via socket
                if (socket) {
                    socket.emit("send_message", {
                        receiverId: userId,
                        messageObj: responseData
                    });
                }
            } else {
                const errorData = await response.json();
                // Show the backend warning (e.g., from the Smart Privacy Filter)
                alert(errorData.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('A network error occurred while sending the message.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const isImage = (mimetype: string) => mimetype.startsWith('image/');

    const renderFileAttachment = (file: FileInfo, isMe: boolean) => {
        const fileUrl = `${API_URL}/uploads/${file.filename}`;

        if (isImage(file.mimetype)) {
            return (
                <div className="mt-2">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img
                            src={fileUrl}
                            alt={file.originalName}
                            className="max-w-full rounded-lg max-h-48 object-cover border border-gray-700"
                        />
                    </a>
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-emerald-800' : 'text-gray-500'}`}>
                        {file.originalName} · {formatFileSize(file.size)}
                    </div>
                </div>
            );
        }

        return (
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${isMe
                    ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${isMe ? 'bg-emerald-700' : 'bg-gray-600'
                    }`}>
                    📄
                </div>
                <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                        {file.originalName}
                    </div>
                    <div className={`text-[10px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {formatFileSize(file.size)}
                    </div>
                </div>
                <svg className={`w-4 h-4 shrink-0 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            </a>
        );
    };

    const startCall = async (type: 'voice' | 'video') => {
        setCalling(type);
        playRingtone(true);
        if (socket && user && userId) {
            socket.emit('call_user', {
                to: userId,
                fromId: user._id,
                fromName: user.name,
                type
            });
            // Don't setup WebRTC until user answers (optimization)
        }
    };

    const endCall = () => {
        if (socket && (userId || incomingCall)) {
            socket.emit('hangup', {
                to: userId || incomingCall?.fromId
            });
        }
        (window as any)._lastIncomingCall = null;
        cleanupCall();
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-64px)] max-w-3xl mx-auto px-2 sm:px-4 py-2 sm:py-6 relative overflow-hidden">
            {/* The Global Overlay is now in Navbar.tsx to ensure it always shows */}

            {/* Calling Modal - for active calls */}
            {calling && (
                <div className="fixed inset-0 z-[999] bg-gray-950/98 backdrop-blur-2xl flex flex-col items-center justify-between py-12 px-4 select-none" style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {/* Top Section: Peer Info */}
                    <div className="text-center relative z-50">
                        <div className={`relative w-24 h-24 mx-auto mb-6 transition-all duration-500 ${(calling === 'video' || incomingCall?.type === 'video') && callAccepted ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
                            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-emerald-500/20">
                                {(partnerData?.name || incomingCall?.fromName || 'P').charAt(0)}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{partnerData?.name || incomingCall?.fromName || 'Partner'}</h2>
                        <p className="text-emerald-400 text-sm font-medium animate-pulse">
                            {callAccepted ? 'Active Call' : (calling === 'video' || incomingCall?.type === 'video' ? 'Video Calling…' : 'Calling…')}
                        </p>
                    </div>

                    {/* Middle Section: Video Display (PiP) */}
                    {(calling === 'video' || incomingCall?.type === 'video') && callAccepted && (
                        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                            {/* Primary Video (Full Screen) */}
                            <div className="absolute inset-0 w-full h-full">
                                <video
                                    ref={primaryView === 'remote' ? remoteVideoRef : localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted={primaryView === 'local'}
                                    className={`w-full h-full object-cover transition-opacity duration-700 ${primaryView === 'local' && isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                                    style={{ transform: primaryView === 'local' ? 'rotateY(180deg)' : 'none' }}
                                />
                                {primaryView === 'local' && isCameraOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                        <div className="text-gray-500 flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            <span className="text-xs font-medium">Camera is off</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Video (Floating PiP) */}
                            <div
                                onClick={() => setPrimaryView(primaryView === 'remote' ? 'local' : 'remote')}
                                className="absolute bottom-32 right-6 w-32 sm:w-48 aspect-[3/4] sm:aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl cursor-pointer hover:scale-105 transition-all group active:scale-95 z-50"
                            >
                                <video
                                    ref={primaryView === 'remote' ? localVideoRef : remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    muted={primaryView === 'remote'}
                                    className={`w-full h-full object-cover ${(primaryView === 'remote' && isCameraOff) ? 'opacity-0' : 'opacity-100'}`}
                                    style={{ transform: primaryView === 'remote' ? 'rotateY(180deg)' : 'none' }}
                                />
                                {primaryView === 'remote' && isCameraOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[8px] text-white/80 font-bold uppercase tracking-widest">
                                    {primaryView === 'remote' ? 'You' : (partnerData?.name || 'Partner')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audio state for voice calls */}
                    {(calling === 'voice' || incomingCall?.type === 'voice') && (
                        <audio ref={remoteVideoRef as any} autoPlay className="hidden" />
                    )}

                    {/* Bottom Section: Controls */}
                    <div className="relative z-50 flex flex-col items-center gap-8 w-full">
                        {callAccepted && (calling === 'voice' || incomingCall?.type === 'voice') && !remoteStream && (
                            <button
                                onClick={() => remoteVideoRef.current?.play().catch(console.error)}
                                className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-widest animate-pulse hover:bg-emerald-500/30 transition-all mb-4"
                            >
                                Tap to Connect Audio
                            </button>
                        )}

                        <div className="flex items-center justify-center gap-6">
                            {/* Mute Button */}
                            <button
                                onClick={toggleMute}
                                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-white/5'}`}
                            >
                                {isMuted ? (
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM10 5a2 2 0 114 0v6a2 2 0 11-4 0V5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22" /></svg>
                                ) : (
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                )}
                            </button>

                            {/* Hang Up */}
                            <button
                                onClick={endCall}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-all shadow-2xl shadow-red-600/40 active:scale-95"
                            >
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.17-.24c1.12.45 2.33.69 3.58.69a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011-1c0 1.25.24 2.46.69 3.58a1 1 0 01-.24 1.17l-2.2 2.2z" />
                                </svg>
                            </button>

                            {/* Camera Toggle (Video only) */}
                            {(calling === 'video' || incomingCall?.type === 'video') && (
                                <button
                                    onClick={toggleCamera}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-white/5'}`}
                                >
                                    {isCameraOff ? (
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l22 22" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header - compact on mobile */}
            <div className="bg-gray-900 rounded-t-xl border border-gray-800 px-3 py-3 sm:p-4 flex items-center gap-2 sm:gap-4 shrink-0">
                <Link to="/inbox" className="text-gray-500 hover:text-white transition-colors shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </Link>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-gray-950 font-bold text-sm sm:text-base shrink-0">
                    {partnerData?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h2 className="font-bold text-white leading-tight text-sm sm:text-base truncate">{partnerData?.name || 'Chat'}</h2>
                        {partnerData?.badge === 'Pro' && (
                            <div className="bg-gradient-to-r from-amber-200 to-yellow-400 text-gray-950 text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                PRO
                            </div>
                        )}
                        {partnerData?.badge === 'Expert' && (
                            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-gray-950 text-[8px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                EXPERT
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Online
                    </span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                    {/* Voice Call */}
                    <button
                        onClick={() => startCall('voice')}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        title="Voice Call"
                    >
                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>
                    {/* Video Call */}
                    <button
                        onClick={() => startCall('video')}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="Video Call"
                    >
                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    {/* View Profile */}
                    <Link to={`/profile/${userId}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all" title="View Profile">
                        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 bg-gray-950 border-x border-gray-800 px-3 py-3 sm:p-6 overflow-y-auto min-h-0"
            >
                <div className="space-y-3 sm:space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No messages yet. Say hello! 👋</p>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user?._id;
                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] sm:max-w-xs md:max-w-md px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${isMe
                                    ? 'bg-emerald-500 text-gray-950 rounded-br-md'
                                    : 'bg-gray-800 text-gray-200 rounded-bl-md'
                                    }`}>
                                    {msg.content && <p className="leading-relaxed text-[13px] sm:text-sm break-words">{msg.content}</p>}
                                    {msg.file && renderFileAttachment(msg.file, isMe)}
                                    {!msg.file && (
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-800' : 'text-gray-500'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* File preview */}
            {
                selectedFile && (
                    <div className="bg-gray-900 px-3 py-2 sm:px-4 sm:py-3 border-x border-gray-800 flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center text-sm sm:text-lg shrink-0">
                            {selectedFile.type.startsWith('image/') ? '🖼️' : '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-white truncate">{selectedFile.name}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                        </div>
                        <button
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1 shrink-0"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )
            }

            {/* Input area */}
            <div className="bg-gray-900 px-2 py-2 sm:p-4 border border-t-0 border-gray-800 rounded-b-xl shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-1.5 sm:gap-3 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={handleFileSelect}
                        className="text-gray-500 hover:text-emerald-400 transition-colors p-2 rounded-lg hover:bg-gray-800 shrink-0"
                        title="Attach file"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-800 border border-gray-700 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                        placeholder={selectedFile ? "Caption..." : "Message..."}
                    />
                    <button
                        type="submit"
                        className="bg-emerald-500 text-gray-950 p-2.5 sm:p-3 rounded-full hover:bg-emerald-400 transition-all active:scale-90 disabled:opacity-50 shrink-0"
                        disabled={(!newMessage.trim() && !selectedFile) || uploading}
                    >
                        {uploading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        )}
                    </button>
                </form>
            </div>
        </div >
    );
};
