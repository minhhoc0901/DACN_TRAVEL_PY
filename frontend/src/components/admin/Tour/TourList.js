// import React from 'react';
// import '../../../styles/itineraryCSS/TourList.css';

// const TourList = ({ 
//   tours, 
//   onEdit, 
//   onDelete, 
//   onApprove, 
//   onReject, 
//   processingTourId,
//   canModerate,
//   currentUserId
// }) => {
//   // Function để hiển thị badge trạng thái
//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 'approved':
//         return <span className="mng-status-badge mng-approved">Đã duyệt</span>;
//       case 'rejected':
//         return <span className="mng-status-badge mng-rejected">Từ chối</span>;
//       case 'pending':
//         return <span className="mng-status-badge mng-pending">Chờ duyệt</span>;
//       default:
//     }
//   };

//   // Kiểm tra quyền sửa và xóa tour
//   const canEditTour = (tour) => {
//     return canModerate || tour.user_id === currentUserId;
//   };

//   // Thêm vào dòng ngay trước khi render để kiểm tra dữ liệu
//   console.log("Tours data:", tours.map(t => ({id: t.id, user_id: t.user_id, username: t.username, full_name: t.full_name})));

//   return (
//     <div className="mng-tour-list">
//       {tours.map(tour => (
//         <div key={tour.id} className={`mng-tour-item mng-${tour.status || 'pending'}`}>
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
//                     e.target.src = '/placeholder-image.jpg';
//                   }}
//                 />
//               )}
//             </div>
            
//             <div className="mng-tour-info">
//               <div className="mng-tour-header">
//                 <h3>{tour.destination}</h3>
//                 {getStatusBadge(tour.status)}
//               </div>
//               <div className="mng-tour-details">
//                 <p><strong>Khởi hành:</strong> {tour.departure_from}</p>
//                 <p><strong>Thời gian:</strong> {tour.duration}</p>
//                 {tour.user_id && (
//                   <p>
//                     <strong>Người đăng:</strong> {
//                       tour.full_name ? 
//                         tour.full_name : 
//                         (tour.username ? 
//                           tour.username : 
//                           (tour.user_id ? 
//                             `Người dùng ID: ${tour.user_id}` : 
//                             'Không có thông tin người đăng')
//                         )
//                     }
//                   </p>
//                 )}
//                 {tour.created_at && (
//                   <p><strong>Ngày tạo:</strong> {new Date(tour.created_at).toLocaleString('vi-VN')}</p>
//                 )}
//                 {tour.updated_at && (
//                   <p><strong>Cập nhật:</strong> {new Date(tour.updated_at).toLocaleString('vi-VN')}</p>
//                 )}
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
            
//             {canModerate && tour.status === 'pending' && (
//               <>
//                 <button 
//                   onClick={() => onApprove(tour.id)} 
//                   className="mng-tour-approve-button"
//                   disabled={processingTourId === tour.id}
//                 >
//                   {processingTourId === tour.id ? 'Đang xử lý...' : <>
//                     <i className="bi bi-check-circle"></i> Phê duyệt
//                   </>}
//                 </button>
//                 <button 
//                   onClick={() => onReject(tour.id)} 
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
//                 onClick={() => onReject(tour.id)} 
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
//                 onClick={() => onApprove(tour.id)} 
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
//                 onClick={() => {
//                   if(window.confirm('Bạn có chắc muốn xóa tour này?')) {
//                     onDelete(tour.id);
//                   }
//                 }} 
//                 className="mng-tour-delete-button"
//                 disabled={processingTourId === tour.id}
//               >
//                 <i className="bi bi-trash"></i> Xóa
//               </button>
//             )}
            
//             <a 
//               href={`/itinerary/${tour.id}`} 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="mng-tour-view-button"
//             >
//               <i className="bi bi-eye"></i> Xem chi tiết
//             </a>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default TourList;


import React from 'react';
import '../../../styles/itineraryCSS/TourList.css';

const TourList = ({ tours, onApprove, onReject, onEdit, onDelete, currentUserId, canModerate, processingTourId }) => {
  
  const getStatusBadge = (status) => {
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
      {tours.map(tour => (
        <div key={tour.id} className={`mng-tour-item mng-${tour.status || 'pending'}`}>
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
                  src={tour.image.startsWith('/') 
                    ? `http://localhost:5000${tour.image}` 
                    : tour.image
                  }
                  alt={tour.destination}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              )}
              {getStatusBadge(tour.status)}
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
            {canEditTour(tour) && (
              <button onClick={() => onEdit(tour)} className="mng-tour-edit-button">
                <i className="bi bi-pencil"></i> Sửa
              </button>
            )}
            
            {/* ✅ NÚT PHÊ DUYỆT - QUAN TRỌNG */}
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
            
            {canEditTour(tour) && (
              <button 
                onClick={() => {
                  if(window.confirm('Bạn có chắc muốn xóa tour này?')) {
                    onDelete(tour.id);
                  }
                }} 
                className="mng-tour-delete-button"
              >
                <i className="bi bi-trash"></i> Xóa
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TourList;