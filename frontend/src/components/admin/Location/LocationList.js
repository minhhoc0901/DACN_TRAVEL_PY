import React from 'react';

const LocationList = ({ locations, onEdit, onDelete }) => {
  return (
    <div className="table-container">
      <table className="location-table">
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>Tên địa điểm</th>
            <th>Loại</th>
            <th>Mô tả</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td>
                <img src={location.introduction.image ? `http://localhost:5000${location.introduction.image}` : 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={location.title}
                        className="location-image" />
              </td>
              <td>{location.title}</td>
              <td>{location.type}</td>
              <td>{location.description}</td>
              <td>
                <button
                  onClick={() => onEdit(location)}
                  className="edit-button-location"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(location.id)}
                  className="delete-button-location"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocationList;