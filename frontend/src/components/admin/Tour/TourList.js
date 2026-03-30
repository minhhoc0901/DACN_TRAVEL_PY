// import React from 'react';
// import '../../../styles/itineraryCSS/TourList.css';

// const TourList = ({ tours, onApprove, onReject, onEdit, onHide, onRestore, onDelete, currentUserId, canModerate, processingTourId }) => {
  
//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 'approved':
//         return <span className="mng-status-badge mng-approved">Đã duyệt</span>;
//       case 'rejected':
//         return <span className="mng-status-badge mng-rejected">Từ chối</span>;
//       case 'pending':
//         return <span className="mng-status-badge mng-pending">Chờ duyệt</span>;
//       default:
//         return <span className="mng-status-badge mng-pending">Chờ duyệt</span>;
//     }
//   };

//   const canEditTour = (tour) => {
//     return canModerate || tour.user_id === currentUserId;
//   };

//   return (
//     <div className="mng-tour-list">
//       {tours.map(tour => (
//         <div key={tour.id} className={`mng-tour-item mng-${tour.status || 'pending'}`}>
//           <div className="mng-tour-author-info">
//             {tour.user_id && (
//               <p>
//                 <strong>Người đăng:</strong> {
//                   tour.full_name || tour.username || `Người dùng ID: ${tour.user_id}`
//                 }
//               </p>
//             )}
//             <div className="mng-tour-dates">
//               {tour.created_at && (
//                 <p><strong>Ngày tạo:</strong> {new Date(tour.created_at).toLocaleString('vi-VN')}</p>
//               )}
//               {tour.updated_at && (
//                 <p><strong>Cập nhật:</strong> {new Date(tour.updated_at).toLocaleString('vi-VN')}</p>
//               )}
//             </div>
//           </div>

//           <div className="mng-tour-content">
//             <div className="mng-tour-image">
//               {tour.image && (
//                 <img 
//                   src={tour.image.startsWith('/') 
//                     ? `http://localhost:5000${tour.image}` 
//                     : tour.image
//                   }
//                   alt={tour.destination}
//                   onError={(e) => {
//                     e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
//                   }}
//                 />
//               )}
//               {getStatusBadge(tour.status)}
//             </div>

//             <div className="mng-tour-info">
//               <h3 className="mng-tour-title">{tour.destination}</h3>
//               <div className="mng-tour-details">
//                 <div className="mng-tour-detail-item">
//                   <i className="bi bi-geo-alt"></i>
//                   <span>Điểm xuất phát: {tour.departure_from}</span>
//                 </div>
//                 <div className="mng-tour-detail-item">
//                   <i className="bi bi-clock"></i>
//                   <span>Thời gian: {tour.duration}</span>
//                 </div>
//               </div>
//               <p className="mng-tour-description">{tour.description}</p>
//             </div>
//           </div>
          
//           <div className="mng-tour-actions">
//             {canEditTour(tour) && (
//               <button onClick={() => onEdit(tour)} className="mng-tour-edit-button">
//                 <i className="bi bi-pencil"></i> Sửa
//               </button>
//             )}
            
//             {/* NÚT PHÊ DUYỆT - QUAN TRỌNG */}
//             {canModerate && tour.status === 'pending' && (
//               <>
//                 <button 
//                   onClick={() => {
//                     console.log('[TourList] Approve button clicked for tour:', tour.id);
//                     onApprove(tour.id);
//                   }} 
//                   className="mng-tour-approve-button"
//                   disabled={processingTourId === tour.id}
//                 >
//                   {processingTourId === tour.id ? 'Đang xử lý...' : <>
//                     <i className="bi bi-check-circle"></i> Phê duyệt
//                   </>}
//                 </button>
//                 <button 
//                   onClick={() => {
//                     console.log('[TourList] Reject button clicked for tour:', tour.id);
//                     onReject(tour.id);
//                   }} 
//                   className="mng-tour-reject-button"
//                   disabled={processingTourId === tour.id}
//                 >
//                   {processingTourId === tour.id ? 'Đang xử lý...' : <>
//                     <i className="bi bi-x-circle"></i> Từ chối
//                   </>}
//                 </button>
//               </>
//             )}
            
//             {canModerate && tour.status === 'approved' && (
//               <button 
//                 onClick={() => {
//                   console.log('[TourList] Un-approve button clicked for tour:', tour.id);
//                   onReject(tour.id);
//                 }} 
//                 className="mng-tour-reject-button"
//                 disabled={processingTourId === tour.id}
//               >
//                 {processingTourId === tour.id ? 'Đang xử lý...' : <>
//                   <i className="bi bi-x-circle"></i> Hủy phê duyệt
//                 </>}
//               </button>
//             )}
            
//             {canModerate && tour.status === 'rejected' && (
//               <button 
//                 onClick={() => {
//                   console.log('[TourList] Re-approve button clicked for tour:', tour.id);
//                   onApprove(tour.id);
//                 }} 
//                 className="mng-tour-approve-button"
//                 disabled={processingTourId === tour.id}
//               >
//                 {processingTourId === tour.id ? 'Đang xử lý...' : <>
//                   <i className="bi bi-check-circle"></i> Phê duyệt
//                 </>}
//               </button>
//             )}

//             {canEditTour(tour) && (
//               <button 
//                   onClick={() => onHide(tour.id)} 
//                   className="mng-tour-hide-button"
//                   disabled={processingTourId === tour.id}
//                   title="Ẩn tour này. Tour sẽ không hiển thị công khai."
//                 >
//                   <i className="bi bi-eye-slash"></i> Ẩn
//                 </button>
//             )}
            
//             {canEditTour(tour) && (
//               <button 
//                 onClick={() => {
//                   if(window.confirm('Bạn có chắc muốn xóa tour này?')) {
//                     onDelete(tour.id);
//                   }
//                 }} 
//                 className="mng-tour-delete-button"
//               >
//                 <i className="bi bi-trash"></i> Xóa
//               </button>
//             )}

//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default TourList;

import React from 'react';
import { getDisplayImageUrl } from '../../../utils/imageUtils';
import '../../../styles/itineraryCSS/TourList.css';

const TourList = ({ tours, onApprove, onReject, onEdit, onHide, onRestore, onDelete, currentUserId, canModerate, processingTourId, activeTab }) => {
  
  const getStatusBadge = (status, isActive) => {
    // ✅ Ưu tiên hiển thị trạng thái "Đã ẩn" nếu tour không active
    if (isActive === false || isActive === 0) {
      return <span className="mng-status-badge mng-hidden">Đã ẩn</span>;
    }
    
    switch (status) {
      case 'approved':
        return <span className="mng-status-badge mng-approved">Đã duyệt</span>;
      case 'rejected':
        return <span className="mng-status-badge mng-rejected">Từ chối</span>;
      case 'pending':
        return <span className="mng-status-badge mng-pending">Chờ duyệt</span>;
      default:
        return <span className="mng-status-badge mng-pending">Chờ duyệt</span>;
    }
  };

  const canEditTour = (tour) => {
    return canModerate || tour.user_id === currentUserId;
  };

  return (
    <div className="mng-tour-list">
      {tours.map(tour => {
        const isActive = tour.is_active !== false && tour.is_active !== 0;
        const isHidden = !isActive;
        
        return (
          <div key={tour.id} className={`mng-tour-item mng-${isHidden ? 'hidden' : (tour.status || 'pending')}`}>
            <div className="mng-tour-author-info">
              {tour.user_id && (
                <p>
                  <strong>Người đăng:</strong> {
                    tour.full_name || tour.username || `Người dùng ID: ${tour.user_id}`
                  }
                </p>
              )}
              <div className="mng-tour-dates">
                {tour.created_at && (
                  <p><strong>Ngày tạo:</strong> {new Date(tour.created_at).toLocaleString('vi-VN')}</p>
                )}
                {tour.updated_at && (
                  <p><strong>Cập nhật:</strong> {new Date(tour.updated_at).toLocaleString('vi-VN')}</p>
                )}
              </div>
            </div>

            <div className="mng-tour-content">
              <div className="mng-tour-image">
                {tour.image && (
                  <img 
                    src={getDisplayImageUrl(tour.image)}
                    alt={tour.destination}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                )}
                {getStatusBadge(tour.status, tour.is_active)}
              </div>

              <div className="mng-tour-info">
                <h3 className="mng-tour-title">{tour.destination}</h3>
                <div className="mng-tour-details">
                  <div className="mng-tour-detail-item">
                    <i className="bi bi-geo-alt"></i>
                    <span>Điểm xuất phát: {tour.departure_from}</span>
                  </div>
                  <div className="mng-tour-detail-item">
                    <i className="bi bi-clock"></i>
                    <span>Thời gian: {tour.duration}</span>
                  </div>
                </div>
                <p className="mng-tour-description">{tour.description}</p>
              </div>
            </div>
            
            <div className="mng-tour-actions">
              {/* ✅ NÚT KHÔI PHỤC - CHỈ HIỂN THỊ KHI TOUR ĐÃ BỊ ẨN */}
              {isHidden && canModerate && (
                <button 
                  onClick={() => {
                    console.log('[TourList] Restore button clicked for tour:', tour.id);
                    onRestore(tour.id);
                  }} 
                  className="mng-tour-restore-button"
                  disabled={processingTourId === tour.id}
                  title="Khôi phục tour này. Tour sẽ được hiển thị lại và đặt về trạng thái 'Chờ duyệt'."
                >
                  {processingTourId === tour.id ? 'Đang xử lý...' : <>
                    <i className="bi bi-arrow-counterclockwise"></i> Khôi phục
                  </>}
                </button>
              )}

              {/* ✅ CÁC NÚT KHÁC - CHỈ HIỂN THỊ KHI TOUR ĐANG HOẠT ĐỘNG */}
              {isActive && (
                <>
                  {canEditTour(tour) && (
                    <button onClick={() => onEdit(tour)} className="mng-tour-edit-button">
                      <i className="bi bi-pencil"></i> Sửa
                    </button>
                  )}
                  
                  {/* NÚT PHÊ DUYỆT */}
                  {canModerate && tour.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          console.log('[TourList] Approve button clicked for tour:', tour.id);
                          onApprove(tour.id);
                        }} 
                        className="mng-tour-approve-button"
                        disabled={processingTourId === tour.id}
                      >
                        {processingTourId === tour.id ? 'Đang xử lý...' : <>
                          <i className="bi bi-check-circle"></i> Phê duyệt
                        </>}
                      </button>
                      <button 
                        onClick={() => {
                          console.log('[TourList] Reject button clicked for tour:', tour.id);
                          onReject(tour.id);
                        }} 
                        className="mng-tour-reject-button"
                        disabled={processingTourId === tour.id}
                      >
                        {processingTourId === tour.id ? 'Đang xử lý...' : <>
                          <i className="bi bi-x-circle"></i> Từ chối
                        </>}
                      </button>
                    </>
                  )}
                  
                  {/* NÚT HỦY PHÊ DUYỆT */}
                  {canModerate && tour.status === 'approved' && (
                    <button 
                      onClick={() => {
                        console.log('[TourList] Un-approve button clicked for tour:', tour.id);
                        onReject(tour.id);
                      }} 
                      className="mng-tour-reject-button"
                      disabled={processingTourId === tour.id}
                    >
                      {processingTourId === tour.id ? 'Đang xử lý...' : <>
                        <i className="bi bi-x-circle"></i> Hủy phê duyệt
                      </>}
                    </button>
                  )}
                  
                  {/* NÚT PHÊ DUYỆT LẠI */}
                  {canModerate && tour.status === 'rejected' && (
                    <button 
                      onClick={() => {
                        console.log('[TourList] Re-approve button clicked for tour:', tour.id);
                        onApprove(tour.id);
                      }} 
                      className="mng-tour-approve-button"
                      disabled={processingTourId === tour.id}
                    >
                      {processingTourId === tour.id ? 'Đang xử lý...' : <>
                        <i className="bi bi-check-circle"></i> Phê duyệt
                      </>}
                    </button>
                  )}

                  {/* NÚT ẨN */}
                  {canEditTour(tour) && (
                    <button 
                      onClick={() => onHide(tour.id)} 
                      className="mng-tour-hide-button"
                      disabled={processingTourId === tour.id}
                      title="Ẩn tour này. Tour sẽ không hiển thị công khai."
                    >
                      <i className="bi bi-eye-slash"></i> Ẩn
                    </button>
                  )}
                </>
              )}
              
              {/* ✅ NÚT XÓA VĨNH VIỄN - HIỂN THỊ CHO CẢ TOUR ACTIVE VÀ HIDDEN */}
              {canModerate && (
                <button 
                  onClick={() => {
                    if(window.confirm('Bạn có chắc muốn xóa vĩnh viễn tour này? Hành động này không thể hoàn tác.')) {
                      onDelete(tour.id);
                    }
                  }} 
                  className="mng-tour-delete-button"
                  title="Xóa vĩnh viễn tour này khỏi hệ thống."
                >
                  <i className="bi bi-trash"></i> Xóa vĩnh viễn
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TourList;