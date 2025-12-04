import React, { useState } from 'react';
import '../../styles/Contact/ContactForm.css';
import axios from 'axios';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const response = await axios.post('http://localhost:5000/api/contact/submit', formData);
        
        if (response.data.success) {
            setSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }
    } catch (error) {
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi liên hệ');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="contact-form-wrapper">
      <h2>Gửi Tin Nhắn</h2>
      {success && (
        <div className="alert alert-success">
          Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-floating mb-3">
          <input
            type="text"
            className="form-control"
            id="name"
            placeholder="Họ và tên"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <label htmlFor="name">Họ và tên</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <label htmlFor="email">Email</label>
        </div>

        <div className="form-floating mb-3">
          <input
            type="text"
            className="form-control"
            id="subject"
            placeholder="Tiêu đề"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            required
          />
          <label htmlFor="subject">Tiêu đề</label>
        </div>

        <div className="form-floating mb-3">
          <textarea
            className="form-control"
            id="message"
            placeholder="Nội dung"
            style={{ height: '120px' }}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          ></textarea>
          <label htmlFor="message">Nội dung</label>
        </div>

        <button 
          type="submit" 
          className="btn-submit" 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Đang gửi...
            </>
          ) : (
            <>
              Gửi tin nhắn
              <i className="bi bi-send ms-2"></i>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;