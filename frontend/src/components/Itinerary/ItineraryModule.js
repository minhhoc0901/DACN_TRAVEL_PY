import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/itineraryCSS/Itinerary.css'; 

const ItineraryModule = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số lượng lịch trình mỗi trang

  // search state + refs for debounce + abort
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);
  const abortRef = useRef(null);

  // reusable fetch function (supports abort via AbortController)
  const fetchTours = async (query = '') => {
    try {
      setLoading(true);
      setError(null);

      // cancel previous in-flight request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      const url = query
        ? `http://localhost:5000/api/tours/search?query=${encodeURIComponent(query)}`
        : 'http://localhost:5000/api/tours';

      const response = await axios.get(url, { signal });
      const data = response.data && (response.data.tours || response.data || []);
      const list = Array.isArray(data) ? data : (data.tours || data || []);
      const approvedTours = Array.isArray(list)
        ? list.filter(t => t.status === 'approved')
        : [];
      setTours(approvedTours);
      setLoading(false);
    } catch (err) {
      if (axios.isCancel?.(err) || err.name === 'CanceledError') {
        // request was cancelled, ignore
        return;
      }
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải tours');
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchTours();

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
    };
  }, []);
 
  // debounce search
  useEffect(() => {
    // reset to first page on new query
    setCurrentPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchTours(searchTerm.trim());
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  // Tính toán lịch trình cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTours = tours.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tours.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage, endPage;

    if (totalPages <= maxPageButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPageButtons / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPageButtons / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPageButtons;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPageButtons + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    if (startPage > 1) {
      pageNumbers.push(
        <li key="1" className={`page-item ${1 === currentPage ? 'active' : ''}`}>
          <button onClick={() => paginate(1)} className="page-link">1</button>
        </li>
      );
      if (startPage > 2) {
        pageNumbers.push(<li key="start-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button onClick={() => paginate(i)} className="page-link">{i}</button>
        </li>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<li key="end-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
      }
      pageNumbers.push(
        <li key={totalPages} className={`page-item ${totalPages === currentPage ? 'active' : ''}`}>
          <button onClick={() => paginate(totalPages)} className="page-link">{totalPages}</button>
        </li>
      );
    }
    return pageNumbers;
  };

  if (loading) return (
    <div className="itinerary-loading-container">
      <div className="itinerary-spinner"></div>
      <p>Đang tải các lịch trình hấp dẫn...</p>
    </div>
  );
  
  if (error) return (
    <div className="itinerary-error-container">
      <div className="itinerary-error-icon"><i className="bi bi-exclamation-triangle-fill"></i></div>
      <h3>Rất tiếc, đã có lỗi xảy ra!</h3>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="itinerary-retry-btn">
        <i className="bi bi-arrow-clockwise"></i> Thử lại
      </button>
    </div>
  );

  return (
    <div className="itinerary-page-container">
      
      <div className="itinerary-header">
        <h1 className="itinerary-page-title">Khám Phá Lịch Trình Phú Yên</h1>
        <p className="itinerary-page-subtitle">
          Những chuyến đi được cộng đồng chia sẻ, đầy ắp trải nghiệm thú vị đang chờ bạn.
        </p>
        <div className="itinerary-action-buttons">
          <Link to="/create-itinerary" className="itinerary-btn itinerary-btn-primary">
            <i className="bi bi-plus-circle-fill"></i> Tạo Lịch Trình Mới
          </Link>
          <Link to="/user/my-tours" className="itinerary-btn itinerary-btn-secondary">
            <i className="bi bi-person-badge"></i> Lịch Trình Của Tôi
          </Link>
        </div>
      </div>

      <div className="itinerary-search">
        <input
          type="itinerary-search"
          placeholder="Tìm kiếm theo tên tour..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="itinerary-search-input"
          aria-label="Tìm kiếm tour"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')} aria-label="Xóa tìm kiếm">
            ✕
          </button>
        )}
      </div>
      
      {tours.length === 0 ? (
        <div className="itinerary-empty-state">
          <div className="itinerary-empty-icon"><i className="bi bi-compass"></i></div>
          <h3>Chưa có lịch trình nào được duyệt</h3>
          <p>Hãy là người đầu tiên chia sẻ hành trình tuyệt vời của bạn tại Phú Yên!</p>
          <Link to="/create-itinerary" className="itinerary-btn itinerary-btn-primary">
            <i className="bi bi-pencil-square"></i> Tạo lịch trình ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="itinerary-grid">
            {currentTours.map(tour => (
              <TourCard 
                key={tour.id} 
                tour={tour} 
              />
            ))}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="itinerary-pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage - 1)} aria-label="Previous">
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {renderPageNumbers()}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage + 1)} aria-label="Next">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

const TourCard = ({ tour }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const authorName = tour.full_name || tour.username || `Người dùng #${tour.user_id}`;
  const authorAvatar = tour.user_avatar ? `http://localhost:5000${tour.user_avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff`;

  return (
    <div className="itinerary-card">
      <Link to={`/tours/${tour.id}`} className="itinerary-card__link">
        <div className="itinerary-card__image-wrapper">
          <img
            src={tour.image && tour.image.startsWith('/') 
              ? `http://localhost:5000${tour.image}` 
              : tour.image || 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'}
            alt={tour.destination || 'Lịch trình Phú Yên'}
            className="itinerary-card__image"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80';
            }}
          />
          <div className="itinerary-card__duration-badge">
            <i className="bi bi-clock"></i> {tour.duration || 'N/A'}
          </div>
        </div>
        <div className="itinerary-card__content">
          <div className="itinerary-card__author-info">
            <img src={authorAvatar} alt={authorName} className="itinerary-card__author-avatar" />
            <span className="itinerary-card__author-name">{authorName}</span>
          </div>
          <h3 className="itinerary-card__title">{tour.destination || 'Chuyến đi thú vị'}</h3>
          <p className="itinerary-card__departure">
            <i className="bi bi-geo-alt-fill"></i> Khởi hành từ: {tour.departure_from || 'N/A'}
          </p>
          <div className="itinerary-card__footer">
            <span className="itinerary-card__date">
              <i className="bi bi-calendar-check"></i> Đăng ngày: {formatDate(tour.created_at)}
            </span>
            <span className="itinerary-card__view-details">
              Xem chi tiết <i className="bi bi-arrow-right-circle-fill"></i>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ItineraryModule;
