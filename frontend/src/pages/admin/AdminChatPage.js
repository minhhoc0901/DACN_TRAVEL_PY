import React, { useEffect, useState, useRef } from 'react';
import { useAdminChat } from '../../contexts/AdminChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { CONFIG } from '../../config';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/admin/ChatwithAdmin.css';

const AdminChatPage = () => {
    const { isAuthenticated, user, getToken } = useAuth();
    const {
        userList,
        selectedUser,
        messages,
        isConnected,
        loading,
        onlineUsers,
        unreadCounts,
        fetchUsers,
        selectUser,
        sendMessage
    } = useAdminChat();

    const [input, setInput] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fetchUsersCalledRef = useRef(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (isAuthenticated && isAdmin && !fetchUsersCalledRef.current) {
            fetchUsersCalledRef.current = true;
            fetchUsers();
        }
    }, [isAuthenticated, isAdmin, fetchUsers]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024;
            if (!isValidType) alert(`File ${file.name} không phải là ảnh.`);
            if (!isValidSize) alert(`File ${file.name} quá lớn (tối đa 5MB).`);
            return isValidType && isValidSize;
        });

        if (selectedImages.length + validFiles.length > 10) {
            alert('Bạn chỉ có thể chọn tối đa 10 ảnh.');
            return;
        }
        setSelectedImages(prev => [...prev, ...validFiles]);
    };
    
    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const uploadImages = async (files) => {
        if (!files || files.length === 0) return [];
        setUploadingImages(true);
        try {
            const token = getToken();
            if (!token) throw new Error('Không có token xác thực');

            const formData = new FormData();
            files.forEach(file => formData.append('images', file));

            const response = await fetch(`${CONFIG.API_API_URL}/chatwithadmin/upload-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok && data.success) {
                return data.imageUrls;
            } else {
                throw new Error(data.message || 'Upload ảnh thất bại.');
            }
        } catch (error) {
            alert(`Lỗi upload ảnh: ${error.message}`);
            return [];
        } finally {
            setUploadingImages(false);
        }
    };
    
    const handleSend = async (e) => {
        e.preventDefault();
        const trimmedMessage = input.trim();
        if (!trimmedMessage && selectedImages.length === 0) return;
        if (!isConnected) return alert('Không có kết nối.');

        let imageUrls = [];
        if (selectedImages.length > 0) {
            imageUrls = await uploadImages(selectedImages);
            if (imageUrls.length === 0 && trimmedMessage) {
                alert('Upload ảnh thất bại. Tin nhắn text vẫn sẽ được gửi.');
            }
        }

        if (trimmedMessage || imageUrls.length > 0) {
            sendMessage(trimmedMessage, imageUrls);
            setInput('');
            setSelectedImages([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const date = new Date(timeStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Vừa xong';
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
            
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch { 
            return ''; 
        }
    };

    const renderUserItem = (user) => {
        const userName = user.fullName || user.username || `User #${user.id}`;
        const isOnline = onlineUsers.has(user.id);
        const unreadCount = unreadCounts[user.id] || 0;
        
        return (
            <li 
                key={user.id} 
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`} 
                onClick={() => selectUser(user)}
            >
                <div className="user-avatar-wrapper">
                    <div className="user-avatar">
                        {user.avatar ? (
                            <img 
                                src={getDisplayImageUrl(user.avatar)} 
                                alt={userName} 
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={`online-status ${isOnline ? 'online' : 'offline'}`}></div>
                </div>
                <div className="user-info">
                    <div className="user-name">{userName}</div>
                    <div className="user-status">
                        {isOnline ? (
                            <span className="status-text online">● Đang hoạt động</span>
                        ) : (
                            <span className="status-text offline">○ Không hoạt động</span>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <div className="unread-badge">{unreadCount}</div>
                )}
            </li>
        );
    };

    const renderMessage = (msg, idx) => {
        const isSentByAdmin = Number(msg.senderId || msg.sender_id) === Number(user?.id);
        const messageClass = `msg-row ${isSentByAdmin ? 'admin' : 'user'}`;

        let imageUrls = [];
        const rawImageUrls = msg.imageUrls || msg.image_url;
        if (rawImageUrls) {
            if (Array.isArray(rawImageUrls)) {
                imageUrls = rawImageUrls;
            } else if (typeof rawImageUrls === 'string') {
                try {
                    const parsed = JSON.parse(rawImageUrls);
                    imageUrls = Array.isArray(parsed) ? parsed : [parsed];
                } catch { 
                    imageUrls = [rawImageUrls]; 
                }
            }
        }

        const userAvatar = selectedUser?.avatar ? getDisplayImageUrl(selectedUser.avatar) : null;

        const messageText = msg.message || msg.text || '';

        return (
            <div key={msg.id || idx} className={messageClass}>
                {!isSentByAdmin && (
                    <div className="msg-avatar">
                        {userAvatar ? (
                            <img src={userAvatar} alt="avatar" />
                        ) : (
                            <div className="avatar-fallback">
                                {(selectedUser?.fullName || selectedUser?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}
                <div className="msg-bubble">
                    {messageText && <div className="message-text">{messageText}</div>}
                    {imageUrls.length > 0 && (
                        <div className="message-images" data-count={imageUrls.length}>
                            {imageUrls.map((url, urlIdx) => {
                                const finalUrl = getDisplayImageUrl(url);
                                return (
                                    <img
                                        key={urlIdx}
                                        src={finalUrl}
                                        alt={`Ảnh ${urlIdx + 1}`}
                                        className="message-image"
                                        onClick={() => window.open(finalUrl, '_blank')}
                                    />
                                );
                            })}
                        </div>
                    )}
                    <div className="msg-time">{formatTime(msg.time || msg.created_at)}</div>
                </div>
            </div>
        );
    };

    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="admin-chat-container">
                <div className="auth-required">
                    <i className="bi bi-shield-lock" style={{ fontSize: '48px', color: '#cbd5e0' }}></i>
                    <h3>Yêu cầu quyền Admin</h3>
                </div>
            </div>
        );
    }

    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="admin-chat-container">
            {!selectedUser && (
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢 Kết nối server' : '🔴 Mất kết nối server'}
                </div>
            )}
            
            <div className="admin-chat-wrapper">
                {/* ===== SIDEBAR ===== */}
                <div className="admin-chat-sidebar">
                    <div className="sidebar-header">
                        <div className="header-left">
                            <i className="bi bi-chat-dots-fill"></i>
                            <h4>Tin nhắn</h4>
                            <span className="user-count">({userList.length})</span>
                        </div>
                        <div className="header-right">
                            {totalUnread > 0 && (
                                <div className="total-unread-badge">{totalUnread}</div>
                            )}
                            <button onClick={fetchUsers} className="refresh-btn" disabled={loading}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                    <ul className="user-list">
                        {loading && userList.length === 0 ? (
                            <li className="loading">
                                <div className="spinner"></div>
                                <span>Đang tải...</span>
                            </li>
                        ) : userList.length > 0 ? (
                            userList.map(renderUserItem)
                        ) : (
                            <li className="no-users">
                                <i className="bi bi-inbox"></i>
                                <span>Không có tin nhắn nào</span>
                            </li>
                        )}
                    </ul>
                </div>
                
                {/* ===== CHAT MAIN ===== */}
                <div className="admin-chat-main">
                    {selectedUser ? (
                        <>
                            {/* ===== CHAT HEADER ===== */}
                            <div className="chat-header">
                                <div className="header-user-info">
                                    <div className="header-avatar-wrapper">
                                        <div className="header-avatar">
                                            {selectedUser.avatar ? (
                                                <img 
                                                    src={getDisplayImageUrl(selectedUser.avatar)} 
                                                    alt={selectedUser.fullName || selectedUser.username} 
                                                />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {(selectedUser.fullName || selectedUser.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`online-status ${onlineUsers.has(selectedUser.id) ? 'online' : 'offline'}`}></div>
                                    </div>
                                    <div className="header-user-details">
                                        <div className="user-name">
                                            {selectedUser.fullName || selectedUser.username || `User #${selectedUser.id}`}
                                        </div>
                                        <div className="user-status">
                                            {onlineUsers.has(selectedUser.id) ? (
                                                <span className="status-text online">● Đang hoạt động</span>
                                            ) : (
                                                <span className="status-text offline">○ Không hoạt động</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={`user-connection-status ${onlineUsers.has(selectedUser.id) ? 'user-online' : 'user-offline'}`}>
                                    {onlineUsers.has(selectedUser.id) ? (
                                        <>
                                            <span className="status-dot online"></span>
                                            <span>Online</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="status-dot offline"></span>
                                            <span>Offline</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ===== MESSAGES ===== */}
                            <div className="admin-chat-messages">
                                {loading ? (
                                    <div className="loading-messages">
                                        <div className="spinner"></div>
                                        <p>Đang tải tin nhắn...</p>
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map(renderMessage)
                                ) : (
                                    <div className="admin-chat-empty">
                                        <i className="bi bi-chat-text" style={{ fontSize: '64px', color: '#cbd5e0' }}></i>
                                        <h3>Chưa có tin nhắn nào</h3>
                                        <p>Hãy bắt đầu cuộc trò chuyện</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ===== FORM ===== */}
                            <form onSubmit={handleSend} className="admin-chat-form">
                                {selectedImages.length > 0 && (
                                    <div className="selected-images-preview">
                                        {selectedImages.map((file, idx) => (
                                            <div key={idx} className="image-preview-item">
                                                <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} />
                                                <button type="button" onClick={() => removeImage(idx)} className="remove-image-btn">
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="input-row">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        disabled={!isConnected || uploadingImages}
                                        className="message-input"
                                    />
                                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" multiple style={{ display: 'none' }} />
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="image-btn" 
                                        disabled={!isConnected || uploadingImages}
                                        title="Đính kèm ảnh"
                                    >
                                        {uploadingImages ? (
                                            <i className="bi bi-hourglass-split"></i>
                                        ) : (
                                            <i className="bi bi-image"></i>
                                        )}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={(!input.trim() && selectedImages.length === 0) || !isConnected || uploadingImages} 
                                        className="send-btn"
                                        title="Gửi tin nhắn"
                                    >
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="admin-chat-empty">
                            <i className="bi bi-chat-dots" style={{ fontSize: '80px', color: '#cbd5e0' }}></i>
                            <h3>Chọn một cuộc trò chuyện để bắt đầu</h3>
                            <p>Chọn người dùng từ danh sách bên trái</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatPage;