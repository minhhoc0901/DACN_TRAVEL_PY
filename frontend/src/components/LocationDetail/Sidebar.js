import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const tocItems = [
  { label: "Giới thiệu", sectionId: "intro", icon: "bi-info-circle" },
  { label: "Vì sao bạn nên ghé thăm?", sectionId: "highlight", icon: "bi-stars" },
  { label: "Thời điểm lý tưởng", sectionId: "timing", icon: "bi-calendar-check" },
  { label: "Thời tiết hiện tại", sectionId: "weather", icon: "bi-thermometer-sun" },
  { label: "Hành trình đến địa điểm", sectionId: "travel", icon: "bi-signpost-split" },
  { label: "Bản đồ địa điểm", sectionId: "map", icon: "bi-map" },
  { label: "Trải nghiệm tại địa điểm", sectionId: "gallery", icon: "bi-images" },
  { label: "Ẩm thực đặc sắc", sectionId: "food", icon: "bi-egg-fried" },
  { label: "Lưu ý khi tham quan", sectionId: "tips", icon: "bi-exclamation-triangle" },
  { label: "Bình luận địa điểm", sectionId: "comments", icon: "bi-chat-dots" } 

];

const Sidebar = ({ location, scrollToSection }) => (
  <div className="content-right w-full md:w-1/4 bg-slate-50 p-6 rounded-lg shadow-lg sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-300 flex items-center">
        <i className="bi bi-list-ul mr-3 text-blue-600"></i>
        Trong bài viết này
      </h3>
      <ul className="list-none p-0 m-0 space-y-1">
        {tocItems.map((item) => (
          <li
            key={item.sectionId}
            onClick={() => scrollToSection(item.sectionId)}
            className="flex items-center p-2 rounded-md text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-150 cursor-pointer group"
          >
            <i className={`${item.icon} mr-3 text-base text-blue-500 group-hover:text-blue-700`}></i>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>

    {location.nearby && location.nearby.length > 0 && (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-300 flex items-center">
          <i className="bi bi-geo-alt-fill mr-3 text-rose-500"></i>
          Gần địa điểm
        </h3>
        <ul className="list-none p-0 m-0 space-y-1">
          {location.nearby.map((place, index) => (
            <li key={index} className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-200 transition-colors duration-150 group">
              <i className="bi bi-pin-map mr-3 text-base text-slate-500 group-hover:text-rose-600"></i>
              {typeof place === 'object' ? (
                <Link to={`/locations/${place.id}`} className="text-slate-700 group-hover:text-rose-600 group-hover:underline">{place.name}</Link>
              ) : (
                <Link to={`/locations/${place}`} className="text-slate-700 group-hover:text-rose-600 group-hover:underline">{place}</Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* ✅ SỬA LẠI TOÀN BỘ PHẦN NÀY */}
    {location.nearbyHotels && location.nearbyHotels.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-300 flex items-center">
          <i className="bi bi-building-check mr-3 text-amber-500"></i>
          Khách sạn liên kết
        </h3>
        <ul className="list-none p-0 m-0 space-y-1">
          {location.nearbyHotels.map((hotel) => {
            
            const ratingAsNumber = parseFloat(hotel.rating);

            return (
              <li key={hotel.id}>
                <a
                  href={hotel.website || '#'}

                  target="_blank"
                  rel="noopener noreferrer"
                  className="hotel-link-item"
                >
                  <i className="bi bi-building hotel-icon"></i>
                  <div className="flex-grow">
                    <span className="hotel-name">{hotel.name}</span>
                    {ratingAsNumber > 0 && (
                      <div className="hotel-rating-display">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`bi ${i < Math.floor(ratingAsNumber) ? 'bi-star-fill' : i < ratingAsNumber ? 'bi-star-half' : 'bi-star'}`}></i>
                        ))}
                        
                        <span className="rating-value">({ratingAsNumber.toFixed(2)})</span>
                      </div>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    )}
    
  </div>
);

Sidebar.propTypes = {
  location: PropTypes.shape({
    nearby: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          name: PropTypes.string.isRequired
        })
      ])
    ), // Made nearby optional as we check for its existence before rendering
    //  Thêm prop type cho nearbyHotels
    nearbyHotels: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        rating: PropTypes.number,
        website: PropTypes.string,
      })
    ),
  }).isRequired,
  scrollToSection: PropTypes.func.isRequired,
};

export default Sidebar;