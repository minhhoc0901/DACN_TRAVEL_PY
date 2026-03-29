import React, { useEffect, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import { tourDepartureService } from '../../services/tourDepartureService';
import axios from 'axios';
import '../../styles/admin/TourDepartureManagement.css';

const TourDepartureManagement = () => {
  const { getToken } = useAuth();
  const [departures, setDepartures] = useState([]);
  const [filteredDepartures, setFilteredDepartures] = useState([]);
  const [toursMap, setToursMap] = useState({});
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    tour_id: '',
    departure_date: '',
    capacity: '',
    slots_booked: 0,
    status: 'OPEN'
  });
  const [saving, setSaving] = useState(false);

  // State cho filters
  const [filters, setFilters] = useState({
    search: '',
    tour_id: '',
    status: '',
    date_from: '',
    date_to: '',
    availability: ''
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect lọc dữ liệu khi filters thay đổi
  useEffect(() => {
    filterDepartures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, departures]);

  async function loadData() {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        toast.error('Vui lòng đăng nhập');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Lấy danh sách tours để map
      const toursResponse = await axios.get('http://localhost:5000/api/tours/admin/tours', { headers });
      const tours = toursResponse.data.success ? toursResponse.data.tours : [];
      const tourMapping = {};
      tours.forEach(tour => {
        tourMapping[tour.id] = tour.destination;
      });
      setToursMap(tourMapping);

      // Lấy tất cả departures sử dụng service
      const departuresData = [];
      for (const tourId of Object.keys(tourMapping)) {
        try {
          const departures = await tourDepartureService.getAllDeparturesForTour(tourId);
          if (departures && departures.length > 0) {
            departuresData.push(...departures);
          }
        } catch (err) {
          console.warn(`Không thể tải departures cho tour ${tourId}:`, err);
        }
      }

      setDepartures(departuresData);
      setFilteredDepartures(departuresData);
      toast.success(`Đã tải ${departuresData.length} lịch khởi hành`);
      console.debug('[TourDepartureManagement] loaded', departuresData.length, 'departures,', Object.keys(tourMapping).length, 'tours');
    } catch (err) {
      console.error('TourDepartureManagement load error:', err);
      toast.error('Không thể tải dữ liệu: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  // Hàm lọc departures
  const filterDepartures = useCallback(() => {
    let result = [...departures];

    // Lọc theo tìm kiếm (tên tour)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(dep => {
        const tourName = toursMap[dep.tour_id]?.toLowerCase() || '';
        return tourName.includes(searchLower) || String(dep.id).includes(filters.search);
      });
    }

    // Lọc theo tour_id
    if (filters.tour_id) {
      result = result.filter(dep => String(dep.tour_id) === String(filters.tour_id));
    }

    // Lọc theo trạng thái
    if (filters.status) {
      result = result.filter(dep => dep.status === filters.status);
    }

    // Lọc theo ngày
    if (filters.date_from) {
      result = result.filter(dep => {
        const depDate = new Date(dep.departure_date);
        const fromDate = new Date(filters.date_from);
        return depDate >= fromDate;
      });
    }

    if (filters.date_to) {
      result = result.filter(dep => {
        const depDate = new Date(dep.departure_date);
        const toDate = new Date(filters.date_to);
        return depDate <= toDate;
      });
    }

    // Lọc theo tình trạng chỗ
    if (filters.availability) {
      result = result.filter(dep => {
        const slotsAvailable = (dep.capacity || 0) - (dep.slots_booked || 0);
        const percentAvailable = dep.capacity > 0 ? (slotsAvailable / dep.capacity) * 100 : 0;

        if (filters.availability === 'available') {
          return slotsAvailable > 0;
        } else if (filters.availability === 'full') {
          return slotsAvailable === 0;
        } else if (filters.availability === 'almost_full') {
          return percentAvailable > 0 && percentAvailable < 20;
        }
        return true;
      });
    }

    setFilteredDepartures(result);
  }, [departures, filters, toursMap]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      tour_id: '',
      status: '',
      date_from: '',
      date_to: '',
      availability: ''
    });
  };

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  }

  function openEdit(departure) {
    setForm({
      id: departure.id,
      tour_id: departure.tour_id,
      departure_date: departure.departure_date ? departure.departure_date.split('T')[0] : '',
      capacity: departure.capacity || '',
      slots_booked: departure.slots_booked || 0,
      status: departure.status || 'OPEN'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openCreate() {
    setForm({
      id: null,
      tour_id: '',
      departure_date: '',
      capacity: '',
      slots_booked: 0,
      status: 'OPEN'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function saveDeparture(e) {
    e?.preventDefault();

    // Validate
    if (!form.tour_id) {
      toast.error('Vui lòng chọn tour');
      return;
    }
    if (!form.departure_date) {
      toast.error('Vui lòng chọn ngày khởi hành');
      return;
    }
    if (!form.capacity || Number(form.capacity) <= 0) {
      toast.error('Sức chứa phải lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tour_id: Number(form.tour_id),
        departure_date: form.departure_date,
        capacity: Number(form.capacity),
        status: form.status
      };

      if (form.id) {
        // Update using service
        await tourDepartureService.updateDeparture(form.id, payload);
        toast.success('Cập nhật lịch khởi hành thành công');
      } else {
        // Create using service
        await tourDepartureService.createDeparture(payload);
        toast.success('Tạo lịch khởi hành thành công');
      }
      
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error('saveDeparture error', err);
      toast.error('Lưu thất bại: ' + (err.message || 'Có lỗi xảy ra'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteDeparture(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch khởi hành này?')) return;

    try {
      await tourDepartureService.deleteDeparture(id);
      toast.success('Đã xóa lịch khởi hành');
      await loadData();
    } catch (err) {
      console.error('deleteDeparture error', err);
      toast.error('Xóa thất bại: ' + (err.message || ''));
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'OPEN':
        return <span className="qlt-status-badge qlt-status-open">Đang mở</span>;
      case 'CLOSED':
        return <span className="qlt-status-badge qlt-status-closed">Đã đóng</span>;
      case 'FULL':
        return <span className="qlt-status-badge qlt-status-full">Đã đầy</span>;
      default:
        return <span className="qlt-status-badge">{status}</span>;
    }
  }

  // Tính toán thống kê
  const calculateStats = () => {
    const totalDepartures = filteredDepartures.length;
    const openDepartures = filteredDepartures.filter(d => d.status === 'OPEN').length;
    const totalCapacity = filteredDepartures.reduce((sum, d) => sum + (d.capacity || 0), 0);
    const totalBooked = filteredDepartures.reduce((sum, d) => sum + (d.slots_booked || 0), 0);
    
    return {
      totalDepartures,
      openDepartures,
      totalCapacity,
      totalBooked,
      availableSlots: totalCapacity - totalBooked
    };
  };

  const stats = calculateStats();

  return (
    <div className="qlt-departure-page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h1 className="qlt-page-title">Quản lý lịch khởi hành</h1>

      {/* FORM SECTION */}
      {showForm && (
        <section className="qlt-top-form-section">
          <form onSubmit={saveDeparture}>
            <div className="qlt-top-form-row">
              <div className="qlt-top-col">
                <label>Tour <span style={{ color: 'red' }}>*</span></label>
                <select
                  name="tour_id"
                  value={form.tour_id}
                  onChange={handleChange}
                  className="qlt-form-control"
                  required
                  disabled={form.id !== null}
                >
                  <option value="">-- Chọn tour --</option>
                  {Object.entries(toursMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="qlt-top-col">
                <label>Ngày khởi hành <span style={{ color: 'red' }}>*</span></label>
                <input
                  name="departure_date"
                  type="date"
                  value={form.departure_date}
                  onChange={handleChange}
                  className="qlt-form-control"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="qlt-top-col">
                <label>Sức chứa <span style={{ color: 'red' }}>*</span></label>
                <input
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  className="qlt-form-control"
                  placeholder="Số lượng chỗ"
                  min="1"
                  required
                />
              </div>

              <div className="qlt-top-col">
                <label>Trạng thái</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="qlt-form-control"
                >
                  <option value="OPEN">Đang mở</option>
                  <option value="CLOSED">Đã đóng</option>
                  <option value="FULL">Đã đầy</option>
                </select>
              </div>

              <div className="qlt-top-col">
                <label style={{ visibility: 'hidden' }}>Actions</label>
                <div className="qlt-top-actions">
                  <button
                    type="button"
                    className="qlt-btn qlt-btn-light"
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="qlt-btn qlt-btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Tạo mới')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* FILTERS SECTION */}
      {!showForm && (
        <div className="qlt-filters-section">
          <div className="qlt-filters-row">
            <div className="qlt-filter-col">
              <label>Tìm kiếm</label>
              <input
                type="text"
                placeholder="ID, tên tour..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="qlt-form-control"
              />
            </div>

            <div className="qlt-filter-col">
              <label>Tour</label>
              <select
                value={filters.tour_id}
                onChange={(e) => handleFilterChange('tour_id', e.target.value)}
                className="qlt-form-control"
              >
                <option value="">Tất cả</option>
                {Object.entries(toursMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="qlt-filter-col">
              <label>Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="qlt-form-control"
              >
                <option value="">Tất cả</option>
                <option value="OPEN">Đang mở</option>
                <option value="CLOSED">Đã đóng</option>
                <option value="FULL">Đã đầy</option>
              </select>
            </div>

            <div className="qlt-filter-col">
              <label>Tình trạng chỗ</label>
              <select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="qlt-form-control"
              >
                <option value="">Tất cả</option>
                <option value="available">Còn chỗ</option>
                <option value="full">Đã đầy</option>
                <option value="almost_full">Sắp đầy (&lt;20%)</option>
              </select>
            </div>
          </div>

          <div className="qlt-filters-row">
            <div className="qlt-filter-col">
              <label>Từ ngày</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="qlt-form-control"
              />
            </div>

            <div className="qlt-filter-col">
              <label>Đến ngày</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="qlt-form-control"
              />
            </div>

            <div className="qlt-filter-col">
              <label>&nbsp;</label>
              <button 
                type="button"
                onClick={handleResetFilters}
                className="qlt-btn qlt-btn-light"
                style={{width: '100%'}}
              >
                Đặt lại
              </button>
            </div>

            <div className="qlt-filter-col">
              <label>&nbsp;</label>
              <button 
                type="button"
                onClick={() => filterDepartures()}
                className="qlt-btn qlt-btn-primary"
                style={{width: '100%'}}
              >
                <i className="fas fa-search"></i> Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS BAR */}
      {!showForm && (
        <div className="qlt-stats-bar">
          <div className="qlt-stat-item">
            <span>Tổng lịch trình</span>
            <strong>{stats.totalDepartures}</strong>
          </div>
          <div className="qlt-stat-item">
            <span>Đang mở</span>
            <strong>{stats.openDepartures}</strong>
          </div>
          <div className="qlt-stat-item">
            <span>Tổng sức chứa</span>
            <strong>{stats.totalCapacity}</strong>
          </div>
          <div className="qlt-stat-item">
            <span>Đã đặt</span>
            <strong>{stats.totalBooked}</strong>
          </div>
          <div className="qlt-stat-item">
            <span>Còn trống</span>
            <strong>{stats.availableSlots}</strong>
          </div>
        </div>
      )}

      {/* CREATE BUTTON */}
      {!showForm && (
        <div style={{ padding: '0 20px', marginBottom: '20px', textAlign: 'right' }}>
          <button
            className="qlt-btn qlt-btn-primary"
            onClick={openCreate}
          >
            <i className="fas fa-plus"></i> Tạo lịch khởi hành mới
          </button>
        </div>
      )}

      {/* TABLE SECTION */}
      <section className="qlt-departure-table-section">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="qlt-table-responsive">
            <table className="qlt-departure-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TOUR</th>
                  <th>NGÀY KHỞI HÀNH</th>
                  <th>NGÀY KẾT THÚC</th>
                  <th style={{ textAlign: 'center' }}>SỨC CHỨA</th>
                  <th style={{ textAlign: 'center' }}>ĐÃ ĐẶT</th>
                  <th style={{ textAlign: 'center' }}>CÒN TRỐNG</th>
                  <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'center', width: 160 }}>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartures.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center' }}>
                    {filters.search || filters.tour_id || filters.status || filters.date_from || filters.date_to || filters.availability
                      ? 'Không tìm thấy kết quả phù hợp'
                      : 'Không có lịch khởi hành nào'}
                  </td></tr>
                ) : filteredDepartures.map(dep => {
                  const id = dep.id;
                  const tourName = toursMap[dep.tour_id] || `Tour #${dep.tour_id}`;
                  const slotsAvailable = (dep.capacity || 0) - (dep.slots_booked || 0);
                  const percentBooked = dep.capacity > 0 
                    ? Math.round((dep.slots_booked / dep.capacity) * 100) 
                    : 0;

                  return (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{tourName}</td>
                      <td>{formatDate(dep.departure_date)}</td>
                      <td>{formatDate(dep.end_date)}</td>
                      <td style={{ textAlign: 'center' }}>{dep.capacity}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: percentBooked >= 80 ? '#e74c3c' : percentBooked >= 50 ? '#f39c12' : '#27ae60',
                          fontWeight: 'bold' 
                        }}>
                          {dep.slots_booked} ({percentBooked}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          color: slotsAvailable === 0 ? '#e74c3c' : slotsAvailable < 5 ? '#f39c12' : '#27ae60',
                          fontWeight: 'bold'
                        }}>
                          {slotsAvailable}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusBadge(dep.status)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="qlt-btn qlt-btn-sm qlt-btn-secondary"
                          onClick={() => openEdit(dep)}
                          style={{ marginRight: 8 }}
                          title="Chỉnh sửa"
                        >
                          <i className="fas fa-edit qlt-icon"></i> Sửa
                        </button>
                        <button
                          className="qlt-btn qlt-btn-sm qlt-btn-danger"
                          onClick={() => deleteDeparture(id)}
                          title="Xóa"
                        >
                          <i className="fas fa-trash qlt-icon"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default TourDepartureManagement;