import React, { useState, useEffect, useRef } from 'react';
import { useChatWithAdmin } from '../../contexts/ChatWithAdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { CONFIG } from '../../config';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/user/ChatWithAdminBox.css';

const ChatWithAdminBox = ({ onClose }) => {
  const { messages, sendMessage, isConnected, loading } = useChatWithAdmin();
  const { user, getToken } = useAuth();
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const total = selectedImages.length + files.length;
    if (total > 5) {
      alert('Tối đa 5 ảnh mỗi lần.');
      return;
    }
    setSelectedImages(prev => [...prev, ...files.slice(0, 5 - prev.length)]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImages = async () => {
    if (!selectedImages.length) return [];
    setUploadingImages(true);
    try {
      const token = getToken();
      if (!token) throw new Error('Cần đăng nhập.');
      const formData = new FormData();
      selectedImages.forEach(f => formData.append('images', f));
      const res = await fetch(`${CONFIG.API_API_URL}/chatwithadmin/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload thất bại.');
      return data.imageUrls || [];
    } catch (err) {
      alert(err.message);
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImages.length) || !isConnected) return;
    let imageUrls = [];
    if (selectedImages.length) {
      imageUrls = await uploadImages();
      if (!imageUrls.length && !input.trim()) return;
    }
    sendMessage(input, imageUrls);
    setInput('');
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderMessageContent = (msg) => (
    <>
      {msg.message && <div className="uwa-message-text">{msg.message}</div>}
      {msg.imageUrls && msg.imageUrls.length > 0 && (
        <div className="uwa-message-images" data-count={msg.imageUrls.length}>
          {msg.imageUrls.map((url, idx) => {
            const full = getDisplayImageUrl(url);
            return (
              <img
                key={idx}
                src={full}
                alt={`Ảnh ${idx + 1}`}
                className="uwa-message-image"
                onClick={() => window.open(full, '_blank')}
              />
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="uwa-chat-box">
      <div className="uwa-header">
        <h4>Chat với Admin</h4>
        <button onClick={onClose} className="uwa-close-btn">×</button>
      </div>
      <div className="uwa-messages">
        {loading && messages.length === 0 && <div className="uwa-loading">Đang tải...</div>}
        {messages.map((msg, idx) => {
          const isMyMessage = Number(msg.senderId || msg.sender_id) === Number(user?.id);
          return (
            <div
              key={msg.id || idx}
              className={`uwa-msg-row ${isMyMessage ? 'uwa-user' : 'uwa-admin'} ${msg.isOptimistic ? 'uwa-optimistic' : ''}`}
            >
              <div className="uwa-msg-bubble">{renderMessageContent(msg)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="uwa-form">
        {selectedImages.length > 0 && (
          <div className="uwa-selected-images">
            {selectedImages.map((file, idx) => (
              <div key={idx} className="uwa-preview-item">
                <img src={URL.createObjectURL(file)} alt="preview" />
                <button type="button" onClick={() => removeImage(idx)} className="uwa-remove-btn">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="uwa-input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="uwa-image-btn"
              disabled={uploadingImages || !isConnected}
            >📷</button>
          <input
            className="uwa-text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
            disabled={!isConnected || uploadingImages}
          />
          <button
            type="submit"
            className="uwa-send-btn"
            disabled={(!input.trim() && !selectedImages.length) || uploadingImages || !isConnected}
          >
            {uploadingImages ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWithAdminBox;