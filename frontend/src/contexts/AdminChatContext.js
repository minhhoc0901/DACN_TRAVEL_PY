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
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [unreadCounts, setUnreadCounts] = useState({});

    const selectedUserRef = useRef(selectedUser);
    const socketRef = useRef(null);
    const fetchUsersCalledRef = useRef(false);
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
            
            // Request online users list
            newSocket.emit('get_online_users');
        };

        const handleDisconnect = () => {
            console.log('[AdminChat] Socket disconnected');
            setIsConnected(false);
        };

        const handleConversationHistory = (conversation) => {
            if (Array.isArray(conversation)) {
                setMessages(conversation);
            } else {
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
                
                // Update messages if it's for current conversation
                if ((Number(senderId) === Number(currentUserId) && Number(receiverId) === adminId) || 
                    (Number(senderId) === adminId && Number(receiverId) === Number(currentUserId))) {
                    setMessages(prev => [...prev, messageData]);
                    
                    // Mark as read if admin is viewing
                    if (Number(senderId) === Number(currentUserId)) {
                        newSocket.emit('mark_as_read', { senderId, receiverId: adminId });
                    }
                } else {
                    // Increment unread count for other users
                    if (Number(senderId) !== adminId) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [senderId]: (prev[senderId] || 0) + 1
                        }));
                    }
                }
            } else {
                // If no user selected, increment unread count
                const { senderId } = messageData;
                if (Number(senderId) !== adminId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [senderId]: (prev[senderId] || 0) + 1
                    }));
                }
            }
        };

        // Handle online users list
        const handleOnlineUsersList = (users) => {
            console.log('[AdminChat] Online users:', users);
            const onlineUserIds = new Set(users.map(u => u.userId));
            setOnlineUsers(onlineUserIds);
        };

        // Handle user status changes
        const handleUserStatusChanged = ({ userId, status }) => {
            console.log('[AdminChat] User status changed:', userId, status);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (status === 'online') {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('disconnect', handleDisconnect);
        newSocket.on('conversation_history_chatadmin', handleConversationHistory);
        newSocket.on('private_message', handleNewMessage);
        newSocket.on('online_users_list', handleOnlineUsersList);
        newSocket.on('user_status_changed', handleUserStatusChanged);

        setSocket(newSocket);

        return () => {
            console.log('[AdminChat] Cleaning up socket connection');
            newSocket.off('connect', handleConnect);
            newSocket.off('disconnect', handleDisconnect);
            newSocket.off('conversation_history_chatadmin', handleConversationHistory);
            newSocket.off('private_message', handleNewMessage);
            newSocket.off('online_users_list', handleOnlineUsersList);
            newSocket.off('user_status_changed', handleUserStatusChanged);
            newSocket.close();
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, adminId, user?.role, getToken]);

    // Fetch users function
    const fetchUsers = async () => {
        const token = getToken();
        
        if (!token || !isAuthenticated) {
            return;
        }

        if (fetchUsersCalledRef.current) {
            return;
        }

        try {
            fetchUsersCalledRef.current = true;
            setLoading(true);
            
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
            
            if (data.success && Array.isArray(data.users)) {
                setUserList(data.users);
                
                // Initialize unread counts
                const counts = {};
                data.users.forEach(user => {
                    if (user.unreadCount) {
                        counts[user.id] = user.unreadCount;
                    }
                });
                setUnreadCounts(counts);
            } else {
                setUserList([]);
            }
        } catch (error) {
            console.error('[AdminChat] Error fetching users:', error);
            setUserList([]);
        } finally {
            setLoading(false);
            fetchUsersCalledRef.current = false;
        }
    };

    // Get conversation
    const getConversation = async (user) => {
        const token = getToken();
        
        if (!token || !user || !adminId) {
            return;
        }
        
        try {
            setLoading(true);
            setMessages([]);
            
            const userId = user.id || user;
            
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
            
            if (data.success && Array.isArray(data.conversation)) {
                setMessages(data.conversation);
            } else {
                setMessages([]);
            }
            
        } catch (error) {
            console.error('[AdminChat] Error getting conversation:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    // Select user and load conversation
    const selectUser = async (user) => {
        console.log('[AdminChat] Selecting user:', user);
        setSelectedUser(user);
        setMessages([]);
        
        // Clear unread count for this user
        const userId = user.id || user;
        setUnreadCounts(prev => ({
            ...prev,
            [userId]: 0
        }));
        
        await getConversation(user);
        
        // Mark messages as read
        if (socket) {
            socket.emit('mark_as_read', { senderId: userId, receiverId: adminId });
        }
    };

    // Send message function
    const sendMessage = (message, imageUrls = []) => {
        if (!socket || !selectedUser || (!message.trim() && imageUrls.length === 0) || !adminId) {
            return;
        }

        const userId = selectedUser.id || selectedUser;
        const messageData = {
            senderId: adminId,
            receiverId: userId,
            message: message.trim(),
            imageUrls: imageUrls
        };
        
        socket.emit('private_message', messageData);
    };

    const value = {
        userList,
        selectedUser,
        messages,
        isConnected,
        loading,
        onlineUsers,
        unreadCounts,
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