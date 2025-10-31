import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatWithAdminContext = createContext();

export const useChatWithAdmin = () => {
    const context = useContext(ChatWithAdminContext);
    if (!context) {
        throw new Error('useChatWithAdmin must be used within a ChatWithAdminProvider');
    }
    return context;
};

export const ChatWithAdminProvider = ({ children }) => {
    const { user, isAuthenticated, getToken } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [adminId, setAdminId] = useState(null);

    const userId = user?.id;

    // 1. Lấy ID của Admin
    useEffect(() => {
        const fetchAdminId = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/chatwithadmin/admin-id');
                const data = await response.json();
                if (data.success && data.adminId) {
                    setAdminId(data.adminId);
                }
            } catch (error) {
                console.error('[ChatWithAdminContext] Error fetching Admin ID:', error);
            }
        };
        fetchAdminId();
    }, []);

    // 2. Thiết lập kết nối Socket cho user
    useEffect(() => {
        if (!isAuthenticated || !userId || !adminId) {
            if (socket) {
                socket.close();
                setSocket(null);
            }
            return;
        }

        const token = getToken();
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: { token }
        });

        const handleConnect = () => {
            setIsConnected(true);
            newSocket.emit('join', `user_${userId}`);
            getConversation(); // Tải lịch sử chat khi kết nối
        };

        const handleDisconnect = () => setIsConnected(false);

        const handleNewMessage = (messageData) => {
            setMessages(prev => {
                const withoutOptimistic = prev.filter(msg => !msg.isOptimistic);
                return [...withoutOptimistic, messageData];
            });
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('disconnect', handleDisconnect);
        newSocket.on('private_message', handleNewMessage);
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [isAuthenticated, userId, adminId, getToken]);

    // 3. Hàm tải lịch sử trò chuyện
    const getConversation = async () => {
        const token = getToken();
        if (!token || !userId || !adminId) return;
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/chatwithadmin/conversation?userId1=${userId}&userId2=${adminId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setMessages(data.success ? data.conversation : []);
        } catch (error) {
            console.error('[ChatWithAdminContext] Error fetching conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    // 4. Hàm gửi tin nhắn
    const sendMessage = (message, imageUrls = []) => {
        if (!socket || (!message.trim() && imageUrls.length === 0)) return;

        const messageData = { senderId: userId, receiverId: adminId, message: message.trim(), imageUrls };
        socket.emit('private_message', messageData);

        const optimisticMessage = { id: Date.now(), senderId: userId, receiverId: adminId, message: message.trim(), imageUrls, time: new Date(), isOptimistic: true };
        setMessages(prev => [...prev, optimisticMessage]);
    };

    const value = { messages, isConnected, loading, sendMessage };

    return (
        <ChatWithAdminContext.Provider value={value}>
            {children}
        </ChatWithAdminContext.Provider>
    );
};