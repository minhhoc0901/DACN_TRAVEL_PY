import React from 'react';
import { getDisplayImageUrl } from '../../../utils/imageUtils';

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
                <img src={getDisplayImageUrl(location.introduction?.image)}
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