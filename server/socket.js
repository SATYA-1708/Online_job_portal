const { Server } = require("socket.io");

let io;

// Keep track of which user is on which socket
// Map: userId -> socketId
const userSocketMap = new Map();

const initSocket = (server) => {
    const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:5000",
        "https://techsparkx.com" // Backup for user
    ].filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: allowedOrigins.length > 0 ? allowedOrigins : true, // true allows current origin
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // 1. User registers their socket connection
        socket.on("register_user", (userId) => {
            if (userId) {
                socket.userId = userId.toString();
                socket.join(socket.userId);
                console.log(`[Socket] Registered User ${userId} to Socket ${socket.id}`);
            }
        });

        // 2. Joining a specific chat room (Internal tracking only, don't join private ID rooms)
        socket.on("join_chat", (chatRoomId) => {
            // socket.join(chatRoomId); // REMOVED: Privacy leak and signaling loopback
            console.log(`[Socket] Socket ${socket.id} focused chat with ${chatRoomId}`);
        });

        // 3. Sender emits a message to receiver
        socket.on("send_message", (data) => {
            const { receiverId, messageObj } = data;
            if (receiverId) {
                io.to(receiverId.toString()).emit("receive_message", messageObj);
            }
        });

        // 4. Voice/Video Call Signaling
        socket.on("call_user", (data) => {
            const { to, fromName, fromId, type } = data;
            const senderId = fromId || socket.userId;
            console.log(`[Socket] Call request from ${senderId} to ${to} (${type})`);

            if (to && senderId) {
                // Ensure the call is not being sent back to the caller if 'to' happens to be 'fromId'
                // This is a server-side check, client-side will also have its own filtering.
                if (to.toString() !== senderId.toString()) {
                    io.to(to.toString()).emit("incoming_call", {
                        fromId: senderId,
                        fromName,
                        type
                    });
                }
            }
        });

        socket.on("answer_call", (data) => {
            const { to, accepted } = data;
            console.log(`[Socket] Call answered by ${socket.userId} for ${to}, accepted: ${accepted}`);
            if (to) {
                io.to(to.toString()).emit("call_answered", { accepted });
            }
        });

        socket.on("hangup", (data) => {
            const { to } = data;
            console.log(`[Socket] Hangup from ${socket.userId} to ${to}`);
            if (to) {
                io.to(to.toString()).emit("call_ended");
            }
        });

        // 5. WebRTC Signaling (SDP & ICE)
        socket.on("webrtc_signal", (data) => {
            const { to, signal, fromId } = data;
            const senderId = fromId || socket.userId;
            if (to && senderId) {
                // Ensure the signal is not being sent back to the sender if 'to' happens to be 'fromId'
                if (to.toString() !== senderId.toString()) {
                    io.to(to.toString()).emit("webrtc_signal", {
                        fromId: senderId,
                        signal
                    });
                }
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
