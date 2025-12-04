import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const AdminChatContext = createContext();

export const useAdminChat = () => {
    const context = useContext(AdminChatContext);
    if (!context) {
        throw new Error('useAdminChat must be used within AdminChatProvider');
    }
    return context;
};

export const AdminChatProvider = ({ children }) => {
    const { user, isAuthenticated, getToken } = useAuth();
    const [socket, setSocket] = useState(null);
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    const selectedUserRef = useRef(selectedUser);
    const socketRef = useRef(null);
    const fetchUsersCalledRef = useRef(false); // ✅ Prevent duplicate calls
    const adminId = user?.id;

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // Socket connection setup
    useEffect(() => {
        const token = getToken();
        
        if (!isAuthenticated || !token || !adminId || user?.role !== 'admin') {
            console.log('[AdminChat] Not ready for connection:', {
                isAuthenticated,
                hasToken: !!token,
                adminId,
                role: user?.role
            });
            return;
        }

        console.log('[AdminChat] Initializing socket connection for admin:', adminId);
        
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket'],
            auth: { token }
        });

        const handleConnect = () => {
            console.log('[AdminChat] Socket connected');
            setIsConnected(true);
            newSocket.emit('join', `user_${adminId}`);
        };

        const handleDisconnect = () => {
            console.log('[AdminChat] Socket disconnected');
            setIsConnected(false);
        };

        const handleConversationHistory = (conversation) => {
            console.log('[AdminChat] Received conversation_history_chatadmin:', conversation);
            
            if (Array.isArray(conversation)) {
                console.log('[AdminChat] Setting messages count:', conversation.length);
                setMessages(conversation);
            } else {
                console.error('[AdminChat] Invalid conversation format:', conversation);
                setMessages([]);
            }
            setLoading(false);
        };

        const handleNewMessage = (messageData) => {
            console.log('[AdminChat] Received private_message:', messageData);
            const currentUser = selectedUserRef.current;
            
            if (currentUser) {
                const currentUserId = currentUser.id || currentUser;
                const { senderId, receiverId } = messageData;
                
                if ((Number(senderId) === Number(currentUserId) && Number(receiverId) === adminId) || 
                    (Number(senderId) === adminId && Number(receiverId) === Number(currentUserId))) {
                    setMessages(prev => [...prev, messageData]);
                }
            }
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('disconnect', handleDisconnect);
        newSocket.on('conversation_history_chatadmin', handleConversationHistory);
        newSocket.on('private_message', handleNewMessage);

        setSocket(newSocket);

        return () => {
            console.log('[AdminChat] Cleaning up socket connection');
            newSocket.off('connect', handleConnect);
            newSocket.off('disconnect', handleDisconnect);
            newSocket.off('conversation_history_chatadmin', handleConversationHistory);
            newSocket.off('private_message', handleNewMessage);
            newSocket.close();
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, adminId, user?.role, getToken]);

    // ✅ FIX: Fetch users function với duplicate call prevention
    const fetchUsers = async () => {
        const token = getToken();
        
        if (!token || !isAuthenticated) {
            console.log('[AdminChat] Cannot fetch users - not authenticated');
            return;
        }

        // ✅ Prevent duplicate calls
        if (fetchUsersCalledRef.current) {
            console.log('[AdminChat] fetchUsers already in progress, skipping...');
            return;
        }

        try {
            fetchUsersCalledRef.current = true;
            setLoading(true);
            console.log('[AdminChat] Fetching users...');
            
            const response = await fetch('http://localhost:5000/api/chatwithadmin/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[AdminChat] Users response:', data);
            
            if (data.success && Array.isArray(data.users)) {
                setUserList(data.users);
            } else {
                setUserList([]);
            }
        } catch (error) {
            console.error('[AdminChat] Error fetching users:', error);
            setUserList([]);
        } finally {
            setLoading(false);
            fetchUsersCalledRef.current = false; // ✅ Reset flag
        }
    };

    // Get conversation using REST API
    const getConversation = async (user) => {
        const token = getToken();
        
        if (!token || !user || !adminId) {
            console.error('[AdminChat] Cannot get conversation - missing dependencies:', {
                hasToken: !!token,
                hasUser: !!user,
                adminId
            });
            return;
        }
        
        try {
            setLoading(true);
            setMessages([]);
            
            const userId = user.id || user;
            console.log('[AdminChat] Getting conversation for user:', userId);
            
            const response = await fetch(
                `http://localhost:5000/api/chatwithadmin/conversation?userId1=${adminId}&userId2=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[AdminChat] Conversation response:', data);
            
            if (data.success && Array.isArray(data.conversation)) {
                console.log('[AdminChat] Setting messages:', data.conversation.length);
                setMessages(data.conversation);
            } else {
                console.error('[AdminChat] Invalid conversation response:', data);
                setMessages([]);
            }
            
        } catch (error) {
            console.error('[AdminChat] Error getting conversation:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    // Select user và load conversation
    const selectUser = async (user) => {
        console.log('[AdminChat] Selecting user:', user);
        setSelectedUser(user);
        setMessages([]);
        
        await getConversation(user);
    };

    // Send message function
    const sendMessage = (message, imageUrls = []) => {
        if (!socket || !selectedUser || (!message.trim() && imageUrls.length === 0) || !adminId) {
            console.log('[AdminChat] Cannot send message - missing dependencies');
            return;
        }
        
        const userId = selectedUser.id || selectedUser;
        const messageData = {
            senderId: adminId,
            receiverId: userId,
            message: message.trim(),
            imageUrls: imageUrls
        };
        
        console.log('[AdminChat] Sending message with images:', messageData);
        socket.emit('private_message', messageData);
    
    };

    // ✅ FIX: Add loading to value
    const value = {
        userList,
        selectedUser,
        messages,
        isConnected,
        loading, // ✅ MISSING - Thêm loading vào value
        fetchUsers,
        selectUser,
        sendMessage,
        getConversation
    };

    return (
        <AdminChatContext.Provider value={value}>
            {children}
        </AdminChatContext.Provider>
    );
};