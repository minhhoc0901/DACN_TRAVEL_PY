import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth/AvatarUpload.css';
import { toast } from 'react-toastify';

const AvatarUpload = () => {
  const { user, getToken, updateUserAvatar } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const defaultAvatar = 'https://via.placeholder.com/150';
  const currentAvatarSrc = user?.avatar ? `http://localhost:5000${user.avatar}` : defaultAvatar;
  const displaySrc = previewUrl || currentAvatarSrc;

  const triggerFileInput = () => {
    if (!isLoading) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) { // User cancelled the file dialog
      fileInputRef.current.value = ""; // Reset input to allow re-selecting the same file
      return;
    }

    // If a file is selected, clear previous error and revoke old preview if it exists
    setError('');
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh định dạng JPG, JPEG hoặc PNG.');
      setPreviewUrl(null);
      setSelectedFile(null);
      fileInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // Max 2MB
      setError('Kích thước file không được vượt quá 2MB.');
      setPreviewUrl(null);
      setSelectedFile(null);
      fileInputRef.current.value = "";
      return;
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      
      const token = getToken();
      const response = await axios.post(
        `http://localhost:5000/api/users/${user.id}/avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        updateUserAvatar(response.data.avatarUrl);
        toast.success('Ảnh đại diện đã được cập nhật!');
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedFile(null);
        fileInputRef.current.value = "";
      } else {
        setError(response.data.message || 'Lỗi khi cập nhật ảnh.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tải lên ảnh đại diện.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUpdate = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError('');
    fileInputRef.current.value = "";
  };

  // Cleanup effect for previewUrl on unmount or when previewUrl itself changes
  useEffect(() => {
    const currentPreview = previewUrl; // Capture current value for cleanup
    return () => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [previewUrl]);

  return (
    <div className="avatar-upload-container">
      <div className={`avatar-wrapper ${isLoading ? 'loading' : ''}`}>
        <img 
          src={displaySrc} 
          alt="Ảnh đại diện" 
          className="profile-avatar" 
        />
        {isLoading && (
          <div className="avatar-loading-spinner">
            <i className="bi bi-arrow-repeat spinning"></i>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/jpg"
        className="hidden-file-input"
        disabled={isLoading}
      />

      {error && <p className="avatar-error-message">{error}</p>}

      {!selectedFile && !isLoading && (
        <button onClick={triggerFileInput} className="btn-trigger-avatar-change">
          <i className="bi bi-camera"></i> Đổi ảnh đại diện
        </button>
      )}

      {selectedFile && !isLoading && (
        <div className="avatar-preview-actions">
          <div className="avatar-confirm-buttons">
            <button onClick={handleConfirmUpdate} className="btn-avatar-confirm btn-avatar-update">
              <i className="bi bi-check-lg"></i> Cập nhật
            </button>
            <button onClick={handleCancelUpdate} className="btn-avatar-confirm btn-avatar-cancel">
              <i className="bi bi-x-lg"></i> Hủy
            </button>
          </div>
           <button onClick={triggerFileInput} className="btn-avatar-reselect">
            <i className="bi bi-pencil-square"></i> Chọn ảnh khác
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;