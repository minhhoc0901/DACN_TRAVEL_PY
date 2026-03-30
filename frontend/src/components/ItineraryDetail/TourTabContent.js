import React from 'react'; // Đảm bảo React được import
import { Link } from 'react-router-dom'; // Đảm bảo Link được import
import TourSidebar from './TourSidebar'; // Đảm bảo TourSidebar được import
import ReviewsList from './ReviewsList';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/itineraryCSS/TourTabContent.css'; // Tạo file CSS này

const DEFAULT_NOTES = [
  "Quý khách vui lòng mang theo giấy tờ tùy thân (CMND/CCCD).",
  "Lịch trình có thể thay đổi tùy theo điều kiện thời tiết và tình hình thực tế.",
  "Trẻ em dưới 2 tuổi miễn phí, từ 2-5 tuổi tính 50% giá tour, từ 6 tuổi trở lên tính như người lớn.",
  "Quý khách nên mang theo thuốc đau bụng, cảm sốt, thuốc chống say xe.",
];

const TourTabContent = ({
    tour,
    activeTab,
    reviews,
    // Props to control RatingModal
    setShowRatingModal,
    isAuthenticated
}) => {

  if (activeTab === 'overview') {
    return (
      <div className="tab-content tour-overview-tab">
        {/* Description Section */}
        <section className="overview-section description-section">
          <h2 className="overview-section-title">
            <i className="bi bi-card-text"></i> Mô tả chi tiết
          </h2>
          <p className="overview-description-text">{tour.description}</p>
        </section>

        {/* Highlights Section */}
        {tour.highlights && tour.highlights.length > 0 && (
          <section className="overview-section highlights-section">
            <h2 className="overview-section-title">
              <i className="bi bi-star-fill"></i> Điểm nổi bật
            </h2>
            <ul className="highlights-list">
              {tour.highlights.map((highlight, index) => (
                <li key={index} className="highlight-item">
                  <i className="bi bi-check-circle-fill highlight-icon"></i>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Locations Section */}
        {tour.locations && tour.locations.length > 0 && (
          <section className="overview-section locations-section-overview">
            <h2 className="overview-section-title">
              <i className="bi bi-geo-alt-fill"></i> Các điểm đến trong hành trình
            </h2>
            <div className="locations-grid-overview">
              {tour.locations.map((location) => (
                <div className="location-card-overview" key={location.id}>
                  <Link to={`/locations/${location.id}`} className="location-card-link-overview">
                    {location.image && (
                      <div className="location-card-image-wrapper-overview">
                        <img 
                          src={getDisplayImageUrl(location.image)} 
                          alt={location.name} 
                          className="location-card-image-overview"
                          onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                        />
                      </div>
                    )}
                    <div className="location-card-content-overview">
                      <h3 className="location-card-title-overview">{location.name}</h3>
                      {/* Bạn có thể thêm loại địa điểm hoặc mô tả ngắn nếu có */}
                      {/* <p className="location-card-type-overview">{location.type}</p> */}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (activeTab === 'schedule') {
    return (
      <div className="tab-content schedule-layout">
        <div className="map-container"> {/* Container cho TourSidebar, có thể là bản đồ hoặc danh sách địa điểm */}
          <TourSidebar tour={tour} />
        </div>
        
        <div className="schedule-content-area"> {/* Container chính cho nội dung lịch trình */}
          <h2 className="schedule-main-title">
            <i className="bi bi-calendar3-week"></i> Chi tiết lịch trình
          </h2>
          {(!tour.schedule || tour.schedule.length === 0) ? (
            <p className="no-schedule-info">Hiện chưa có thông tin lịch trình chi tiết cho tour này.</p>
          ) : (
            <div className="schedule-timeline">
              {tour.schedule.map((day, index) => (
                <div key={index} className="schedule-day-item">
                  <div className="schedule-day-marker">
                    <span className="day-number">{index + 1}</span>
                  </div>
                  <div className="schedule-day-card">
                    <div className="schedule-day-header">
                      <h3 className="schedule-day-title-text">{day.day}: {day.title}</h3>
                      {day.date && (
                        <p className="schedule-day-date">
                          <i className="bi bi-calendar-event"></i> {new Date(day.date).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>

                    {day.activities && day.activities.length > 0 && (
                      <div className="schedule-section schedule-activities-section">
                        <h4 className="schedule-section-title">
                          <i className="bi bi-list-ul"></i> Hoạt động trong ngày
                        </h4>
                        <ul className="activities-list">
                          {day.activities.map((activity, actIndex) => (
                            <li key={actIndex} className="activity-item">
                              <i className="bi bi-check2-circle activity-icon"></i>
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {day.locations && day.locations.length > 0 && (
                      <div className="schedule-section schedule-locations-section">
                        <h4 className="schedule-section-title">
                          <i className="bi bi-geo-alt"></i> Điểm đến trong ngày
                        </h4>
                        <div className="locations-grid-schedule">
                          {day.locations.map((location) => (
                            <Link 
                              to={`/locations/${location.id}`} 
                              key={location.id} 
                              className="location-card-schedule"
                            >
                              {location.image && (
                                <img
                                  src={getDisplayImageUrl(location.image)}
                                  alt={location.name}
                                  className="location-image-schedule"
                                  onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                                />
                              )}
                              <div className="location-info-schedule">
                                <span className="location-name-schedule">{location.name}</span>
                                {location.type && <span className="location-type-schedule">{location.type}</span>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'info') {
    return (
      <div className="tab-content tour-info-tab">
        <div className="tour-experience-info">
          <div className="info-section">
            <h2>
               Trải nghiệm nổi bật
            </h2>
            <ul className="info-list">
              {tour.includes && tour.includes.length > 0 ? (
                tour.includes.map((item, index) => (
                  <li key={index}>
                    <i className="bi bi-check-circle-fill info-icon info-icon-include"></i>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li>Chưa có thông tin trải nghiệm nổi bật.</li>
              )}
            </ul>
          </div>
          <div className="info-section">
            <h2>
               Không bao gồm
            </h2>
            <ul className="info-list">
              {tour.excludes && tour.excludes.length > 0 ? (
                tour.excludes.map((item, index) => (
                  <li key={index}>
                    <i className="bi bi-dash-circle-fill info-icon info-icon-exclude"></i>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li>Không có thông tin loại trừ.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="tour-notes info-section">
          <h2>
            <i className="bi bi-info-circle"></i> Lưu ý khi khám phá
          </h2>
          <ul className="info-list">
            {(tour.notes && tour.notes.length > 0 ? tour.notes : DEFAULT_NOTES).map((note, index) => (
              <li key={index}>
                <i className="bi bi-dot info-icon info-icon-note"></i>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (activeTab === 'reviews') {
    return (
      <div className="tab-content reviews-tab-content">
        <div className="reviews-header">
          <h2>Đánh giá từ khách hàng ({reviews ? reviews.length : 0})</h2>
          {isAuthenticated && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="add-review-btn"
            >
              <i className="bi bi-pencil-square"></i> Viết đánh giá
            </button>
          )}
        </div>
        <ReviewsList reviews={reviews} />
      </div>
    );
  }

  return null;
};

export default TourTabContent;