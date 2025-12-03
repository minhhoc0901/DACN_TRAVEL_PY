
import React, { useEffect, useState, useRef } from 'react';
import { useAdminChat } from '../../contexts/AdminChatContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin/ChatwithAdmin.css';

const AdminChatPage = () => {
    const { isAuthenticated, user, getToken } = useAuth();
    const {
        userList,
        selectedUser,
        messages,
        isConnected,
        loading,
        fetchUsers,
        selectUser,
        sendMessage
        // ✅ Đã xóa 'getConversation' không sử dụng
    } = useAdminChat();

    const [input, setInput] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fetchUsersCalledRef = useRef(false);

    const isAdmin = user?.role === 'admin';

    // Load users when component mounts
    useEffect(() => {
        if (isAuthenticated && isAdmin && !fetchUsersCalledRef.current) {
            fetchUsersCalledRef.current = true;
            fetchUsers();
        }
    }, [isAuthenticated, isAdmin, fetchUsers]);

    // Auto scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle image selection
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
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

            const response = await fetch('http://localhost:5000/api/chatwithadmin/upload-image', {
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
            return new Date(timeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const renderUserItem = (user) => {
        const userName = user.fullName || user.username || `User #${user.id}`;
        return (
            <li key={user.id} className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`} onClick={() => selectUser(user)}>
                <div className="user-avatar">
                    {user.avatar ? (
                        <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} alt={userName} />
                    ) : (
                        <div className="avatar-placeholder">{userName.charAt(0).toUpperCase()}</div>
                    )}
                </div>
                <div className="user-info">
                    <div className="user-name">{userName}</div>
                </div>
            </li>
        );
    };

    const renderMessage = (msg, idx) => {
        const isSentByAdmin = Number(msg.senderId || msg.sender_id) === Number(user?.id);
        // Admin bên phải, User bên trái
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
                } catch { imageUrls = [rawImageUrls]; }
            }
        }

        const userAvatar = selectedUser?.avatar
            ? (selectedUser.avatar.startsWith('http')
                ? selectedUser.avatar
                : `http://localhost:5000${selectedUser.avatar}`)
            : null;

        return (
            <div key={msg.id || idx} className={messageClass}>
                {!isSentByAdmin && (
                    <div className="msg-avatar">
                        {userAvatar
                            ? <img src={userAvatar} alt="avatar" />
                            : <div className="avatar-fallback">
                                {(selectedUser?.username || selectedUser?.fullName || 'U').charAt(0).toUpperCase()}
                              </div>}
                    </div>
                )}
                <div className={`msg-bubble`}>
                    {msg.message && <div className="message-text">{msg.message}</div>}
                    {imageUrls.length > 0 && (
                        <div className="message-images" data-count={imageUrls.length}>
                            {imageUrls.map((url, urlIdx) => {
                                const finalUrl = url && url.startsWith('http') ? url : `http://localhost:5000${url}`;
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
        return <div className="admin-chat-container"><div className="auth-required"><h3>Yêu cầu quyền Admin</h3></div></div>;
    }

    return (
        <div className="admin-chat-container">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
            </div>
            <div className="admin-chat-wrapper">
                <div className="admin-chat-sidebar">
                    <div className="sidebar-header">
                        <h4>Danh sách chat ({userList.length})</h4>
                        <button onClick={fetchUsers} className="refresh-btn" disabled={loading}>↻</button>
                    </div>
                    <ul className="user-list">
                        {loading && userList.length === 0 ? <li className="loading"><span>Đang tải...</span></li>
                        : userList.length > 0 ? userList.map(renderUserItem)
                        : <li className="no-users">Không có user nào đã chat</li>}
                    </ul>
                </div>
                
                <div className="admin-chat-main">
                    {selectedUser ? (
                        <>
                            <div className="chat-header">
                                <div className="user-name">{selectedUser.fullName || selectedUser.username || `User #${selectedUser.id}`}</div>
                            </div>
                            <div className="admin-chat-messages">
                                {loading ? <div className="loading-messages">Đang tải tin nhắn...</div>
                                : messages.length > 0 ? messages.map(renderMessage)
                                : <div className="admin-chat-empty">Chưa có tin nhắn nào</div>}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSend} className="admin-chat-form">
                                {selectedImages.length > 0 && (
                                    <div className="selected-images-preview">
                                        {selectedImages.map((file, idx) => (
                                            <div key={idx} className="image-preview-item">
                                                <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} />
                                                <button type="button" onClick={() => removeImage(idx)} className="remove-image-btn">×</button>
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
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="image-btn" disabled={!isConnected || uploadingImages}>
                                        {uploadingImages ? '⏳' : '📷'}
                                    </button>
                                    <button type="submit" disabled={(!input.trim() && selectedImages.length === 0) || !isConnected || uploadingImages} className="send-btn">
                                        Gửi
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="admin-chat-empty">
                            <h3>Chọn một user để bắt đầu chat</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatPage;