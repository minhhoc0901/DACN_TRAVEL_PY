import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import { hotelService } from '../../services/hotelService';
import { getDisplayImageUrl } from '../../utils/imageUtils';
import '../../styles/admin/HotelManagement.css';

const HotelManagement = () => {
  const { getToken } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    rating: '',
    price_range: '',
    description: '',
    image: null,
    imagePreview: null
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Vui lòng đăng nhập');
        return;
      }

      const hotelsData = await hotelService.getAllHotels();
      setHotels(hotelsData);
      console.debug('[HotelManagement] loaded', hotelsData.length, 'hotels');
    } catch (err) {
      console.error('HotelManagement load error:', err);
      toast.error('Không thể tải dữ liệu: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  function openEdit(hotel) {
    setForm({
      id: hotel.id,
      name: hotel.name || '',
      address: hotel.address || '',
      latitude: hotel.latitude || '',
      longitude: hotel.longitude || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      website: hotel.website || '',
      rating: hotel.rating || '',
      price_range: hotel.price_range || '',
      description: hotel.description || '',
      image: hotel.image || null,
      imagePreview: getDisplayImageUrl(hotel.image)
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openCreate() {
    setForm({
      id: null,
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      website: '',
      rating: '',
      price_range: '',
      description: '',
      image: null,
      imagePreview: null
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file quá lớn. Tối đa 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Loại file không hợp lệ');
        return;
      }

      const previewURL = URL.createObjectURL(file);
      setForm(prev => ({
        ...prev,
        image: file,
        imagePreview: previewURL
      }));
    }
  }

  async function saveHotel(e) {
    e?.preventDefault();

    // Validate
    if (!form.name || !form.name.trim()) {
      toast.error('Vui lòng nhập tên khách sạn');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address?.trim() || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        website: form.website?.trim() || null,
        rating: form.rating ? parseFloat(form.rating) : null,
        price_range: form.price_range?.trim() || null,
        description: form.description?.trim() || null
      };

      // Xử lý ảnh
      if (form.image instanceof File) {
        payload.image = form.image;
      } else if (form.image && typeof form.image === 'string') {
        payload.image = form.image;
      }

      if (form.id) {
        // Update
        await hotelService.updateHotel(form.id, payload);
        toast.success('Cập nhật khách sạn thành công');
      } else {
        // Create
        await hotelService.createHotel(payload);
        toast.success('Tạo khách sạn thành công');
      }
      
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error('saveHotel error', err);
      toast.error('Lưu thất bại: ' + (err.message || 'Có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteHotel(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách sạn này?')) return;

    try {
      await hotelService.deleteHotel(id);
      toast.success('Đã xóa khách sạn');
      await loadData();
    } catch (err) {
      console.error('deleteHotel error', err);
      toast.error('Xóa thất bại: ' + (err.message || ''));
    }
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchKeyword.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);
      const results = await hotelService.searchHotels(searchKeyword.trim());
      setHotels(results);
    } catch (err) {
      toast.error('Tìm kiếm thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page hotel-page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title">Quản lý khách sạn</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="fas fa-plus"></i> Tạo khách sạn mới
          </button>
        )}
      </div>

      {/* Search Bar */}
      {!showForm && (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-secondary">
              <i className="fas fa-search"></i> Tìm kiếm
            </button>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  loadData();
                }}
                className="btn btn-light"
              >
                <i className="fas fa-times"></i> Xóa
              </button>
            )}
          </form>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <section className="hotel-form-section">
          <form onSubmit={saveHotel} className="hotel-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Tên khách sạn <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: Sala Tuy Hòa Beach Resort"
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: Bãi Xép, Tuy Hòa, Phú Yên"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: 0257 3123 456"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: info@hotel.com"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: https://hotel.com"
                />
              </div>

              <div className="form-group">
                <label>Đánh giá (0-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="VD: 4.5"
                />
              </div>

              <div className="form-group">
                <label>Khoảng giá</label>
                <input
                  type="text"
                  name="price_range"
                  value={form.price_range}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="VD: 1.500.000đ - 3.000.000đ/đêm"
                />
              </div>

              <div className="form-group">
                <label>Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  className="form-control"
                  step="any"
                  placeholder="VD: 13.0924"
                />
              </div>

              <div className="form-group">
                <label>Kinh độ (Longitude)</label>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  className="form-control"
                  step="any"
                  placeholder="VD: 109.2967"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-control"
                rows="4"
                placeholder="Mô tả chi tiết về khách sạn..."
              />
            </div>

            <div className="form-group full-width">
              <label>Ảnh khách sạn</label>
              {form.imagePreview && (
                <div className="image-preview-container">
                  <img src={form.imagePreview} alt="Preview" className="image-preview" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-control"
              />
              <small className="form-hint">
                Hỗ trợ: JPEG, PNG, GIF, WEBP. Kích thước tối đa: 5MB
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Table Section */}
      <section className="hotel-table-section">
        {loading ? (
          <p className="loading-text">Đang tải...</p>
        ) : (
          <div className="table-responsive">
            <table className="table hotel-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ẢNH</th>
                  <th>TÊN KHÁCH SẠN</th>
                  <th>ĐỊA CHỈ</th>
                  <th>ĐIỆN THOẠI</th>
                  <th style={{ textAlign: 'center' }}>ĐÁNH GIÁ</th>
                  <th>KHOẢNG GIÁ</th>
                  <th style={{ textAlign: 'center', width: 160 }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>
                      Không có khách sạn nào
                    </td>
                  </tr>
                ) : hotels.map(hotel => (
                  <tr key={hotel.id}>
                    <td>{hotel.id}</td>
                    <td>
                      {hotel.image ? (
                        <img
                          src={getDisplayImageUrl(hotel.image)}
                          alt={hotel.name}
                          className="hotel-thumbnail"
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td>
                      <strong>{hotel.name}</strong>
                      {hotel.website && (
                        <div>
                          <a
                            href={hotel.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hotel-website"
                          >
                            <i className="fas fa-external-link-alt"></i> Website
                          </a>
                        </div>
                      )}
                    </td>
                    <td>{hotel.address || '-'}</td>
                    <td>
                      {hotel.phone || '-'}
                      {hotel.email && (
                        <div className="hotel-email">{hotel.email}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {hotel.rating ? (
                        <span className="rating-badge">
                          <i className="fas fa-star"></i> {hotel.rating}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{hotel.price_range || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEdit(hotel)}
                        style={{ marginRight: 8 }}
                        title="Chỉnh sửa"
                      >
                        <i className="fas fa-edit"></i> Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteHotel(hotel.id)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelManagement;