import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatWithAdminContext = createContext();

export const useChatWithAdmin = () => useContext(ChatWithAdminContext);

export const ChatWithAdminProvider = ({ children }) => {
    const { user, isAuthenticated, getToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [adminId, setAdminId] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const socketRef = useRef(null); // Sử dụng useRef để lưu socket
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

    // 2. Hàm tải lịch sử trò chuyện
    const getConversation = useCallback(async () => {
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
    }, [getToken, userId, adminId]);

    // 3. Thiết lập kết nối Socket
    useEffect(() => {
        if (!isAuthenticated || !userId || !adminId) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            return;
        }

        const token = getToken();
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: { token }
        });

        socketRef.current = newSocket;

        const handleConnect = () => {
            setIsConnected(true);
            newSocket.emit('join', `user_${userId}`);
            getConversation();
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

        return () => {
            newSocket.off('connect', handleConnect);
            newSocket.off('disconnect', handleDisconnect);
            newSocket.off('private_message', handleNewMessage);
            newSocket.close();
            socketRef.current = null;
        };
    }, [isAuthenticated, userId, adminId, getToken, getConversation]);

    // 4. Hàm gửi tin nhắn
    const sendMessage = (message, imageUrls = []) => {
        if (!socketRef.current || (!message.trim() && imageUrls.length === 0)) return;

        const messageData = { 
            senderId: userId, 
            receiverId: adminId, 
            message: message.trim(), 
            imageUrls 
        };
        
        socketRef.current.emit('private_message', messageData);

        const optimisticMessage = { 
            id: Date.now(), 
            senderId: userId, 
            receiverId: adminId, 
            message: message.trim(), 
            imageUrls, 
            time: new Date(), 
            isOptimistic: true 
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
    };

    const openChat = () => setIsChatOpen(true);

    const value = { 
        messages, 
        isConnected, 
        loading, 
        sendMessage, 
        isChatOpen, 
        setIsChatOpen, 
        openChat 
    };

    return (
        <ChatWithAdminContext.Provider value={value}>
            {children}
        </ChatWithAdminContext.Provider>
    );
};