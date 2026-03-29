import React, { useEffect, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { tourPriceService } from '../../services/tourpriceService';
import '../../styles/admin/PriceTourManagement.css';

const PriceTourManagement = () => {
  const [prices, setPrices] = useState([]);
  const [filteredPrices, setFilteredPrices] = useState([]);
  const [toursMap, setToursMap] = useState({});
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    tour_id: '',
    price_type: 'adult',
    price: '',
    sale_price: ''
  });
  const [saving, setSaving] = useState(false);

  // ✅ State cho filters
  const [filters, setFilters] = useState({
    search: '',
    tour_id: '',
    price_type: '',
    sale_status: '',
    price_min: '',
    price_max: ''
  });

  useEffect(() => { loadData(); }, []);

  // ✅ Effect lọc khi filters thay đổi
  useEffect(() => {
    filterPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, prices]);

  async function loadData() {
    setLoading(true);
    try {
      const [pricesList, toursMapData] = await Promise.all([
        tourPriceService.getAllPrices(),
        tourPriceService.getToursMap()
      ]);

      setToursMap(toursMapData);
      setPrices(pricesList);
      setFilteredPrices(pricesList);
      toast.success(`Đã tải ${pricesList.length} mức giá`);
    } catch (err) {
      console.error('PriceTourManagement load error:', err);
      toast.error('Không thể tải dữ liệu: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  // ✅ Hàm lọc prices
  const filterPrices = useCallback(() => {
    let result = [...prices];

    // Lọc theo tìm kiếm (tên tour)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(price => {
        const tourName = toursMap[price.tour_id]?.toLowerCase() || '';
        return tourName.includes(searchLower);
      });
    }

    // Lọc theo tour_id
    if (filters.tour_id) {
      result = result.filter(p => String(p.tour_id) === String(filters.tour_id));
    }

    // Lọc theo loại giá
    if (filters.price_type) {
      result = result.filter(p => p.price_type === filters.price_type);
    }

    // Lọc theo trạng thái giảm giá
    if (filters.sale_status) {
      if (filters.sale_status === 'on_sale') {
        result = result.filter(p => p.sale_price && parseFloat(p.sale_price) > 0);
      } else if (filters.sale_status === 'regular') {
        result = result.filter(p => !p.sale_price || parseFloat(p.sale_price) === 0);
      }
    }

    // Lọc theo khoảng giá
    if (filters.price_min) {
      result = result.filter(p => {
        const effectivePrice = p.sale_price && parseFloat(p.sale_price) > 0 
          ? parseFloat(p.sale_price) 
          : parseFloat(p.price);
        return effectivePrice >= parseFloat(filters.price_min);
      });
    }

    if (filters.price_max) {
      result = result.filter(p => {
        const effectivePrice = p.sale_price && parseFloat(p.sale_price) > 0 
          ? parseFloat(p.sale_price) 
          : parseFloat(p.price);
        return effectivePrice <= parseFloat(filters.price_max);
      });
    }

    setFilteredPrices(result);
  }, [prices, filters, toursMap]);

  // ✅ Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ Reset filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      tour_id: '',
      price_type: '',
      sale_status: '',
      price_min: '',
      price_max: ''
    });
  };

  function fmtMoney(val) {
    if (val === null || val === undefined || val === '') return '-';
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString('vi-VN') + ' đ';
  }

  function openEdit(p) {
    setForm({
      id: p.id ?? p._id ?? null,
      tour_id: String(p.tour_id ?? p.tourId ?? ''),
      price_type: p.price_type ?? 'adult',
      price: p.price ?? '',
      sale_price: p.sale_price ?? ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openCreate() {
    setForm({
      id: null,
      tour_id: '',
      price_type: 'adult',
      price: '',
      sale_price: ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function savePrice(e) {
    e?.preventDefault();
    
    if (!form.tour_id) {
      toast.error('Vui lòng chọn tour');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        tour_id: Number(form.tour_id),
        price_type: form.price_type,
        price: form.price === '' ? null : Number(form.price),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price)
      };

      if (form.id) {
        await tourPriceService.updatePrice(form.id, payload);
        toast.success('Cập nhật thành công');
      } else {
        await tourPriceService.createPrice(payload);
        toast.success('Tạo thành công');
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error('savePrice error', err);
      toast.error('Lưu thất bại: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  }

  async function deletePrice(id) {
    if (!window.confirm('Xóa mức giá này?')) return;
    try {
      await tourPriceService.deletePrice(id);
      toast.success('Đã xóa');
      await loadData();
    } catch (err) {
      console.error('deletePrice error', err);
      toast.error('Xóa thất bại: ' + (err.message || ''));
    }
  }

  return (
    <div className="admin-page price-page">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h1 className="page-title">Quản lý giá tour</h1>
        {!showForm && (
          <button 
            className="btn btn-primary" 
            onClick={openCreate}
          >
            <i className="fas fa-plus"></i> Tạo giá mới
          </button>
        )}
      </div>

      {/* ✅ FILTERS SECTION */}
      {!showForm && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-col">
              <label><i className="fas fa-search"></i> Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tìm theo tên tour..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-control"
              />
            </div>

            <div className="filter-col">
              <label><i className="fas fa-map-marker-alt"></i> Tour</label>
              <select
                value={filters.tour_id}
                onChange={(e) => handleFilterChange('tour_id', e.target.value)}
                className="form-control"
              >
                <option value="">Tất cả tour</option>
                {Object.entries(toursMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="filter-col">
              <label><i className="fas fa-user-tag"></i> Loại giá</label>
              <select
                value={filters.price_type}
                onChange={(e) => handleFilterChange('price_type', e.target.value)}
                className="form-control"
              >
                <option value="">Tất cả</option>
                <option value="adult">Người lớn</option>
                <option value="child">Trẻ em</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="filter-col">
              <label><i className="fas fa-tags"></i> Trạng thái</label>
              <select
                value={filters.sale_status}
                onChange={(e) => handleFilterChange('sale_status', e.target.value)}
                className="form-control"
              >
                <option value="">Tất cả</option>
                <option value="on_sale">Đang giảm giá</option>
                <option value="regular">Giá thường</option>
              </select>
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-col">
              <label><i className="fas fa-money-bill-wave"></i> Giá từ (VNĐ)</label>
              <input
                type="number"
                placeholder="Giá tối thiểu"
                value={filters.price_min}
                onChange={(e) => handleFilterChange('price_min', e.target.value)}
                className="form-control"
              />
            </div>

            <div className="filter-col">
              <label><i className="fas fa-money-bill-wave"></i> Giá đến (VNĐ)</label>
              <input
                type="number"
                placeholder="Giá tối đa"
                value={filters.price_max}
                onChange={(e) => handleFilterChange('price_max', e.target.value)}
                className="form-control"
              />
            </div>

            <div className="filter-col">
              <label>&nbsp;</label>
              <button 
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{width: '100%'}}
              >
                <i className="fas fa-undo"></i> Đặt lại
              </button>
            </div>

            <div className="filter-col">
              <label>&nbsp;</label>
              <button 
                type="button"
                onClick={() => filterPrices()}
                className="btn btn-primary"
                style={{width: '100%'}}
              >
                <i className="fas fa-search"></i> Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* FORM - giữ nguyên */}
      {showForm && (
        <section className="top-form-section">
          <form onSubmit={savePrice} className="top-form">
            <div className="top-form-row">
              <div className="top-col">
                <label>Tour <span style={{color:'red'}}>*</span></label>
                <select 
                  name="tour_id" 
                  value={form.tour_id} 
                  onChange={handleChange} 
                  className="form-control"
                  required
                  disabled={form.id !== null} // Không cho đổi tour khi edit
                >
                  <option value="">-- Chọn tour --</option>
                  {Object.entries(toursMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="top-col">
                <label>Loại giá <span style={{color:'red'}}>*</span></label>
                <select 
                  name="price_type" 
                  value={form.price_type} 
                  onChange={handleChange} 
                  className="form-control"
                  required
                >
                  <option value="adult">Người lớn (adult)</option>
                  <option value="child">Trẻ em (child)</option>
                  <option value="other">Khác (other)</option>
                </select>
              </div>

              <div className="top-col">
                <label>Giá gốc (VNĐ) <span style={{color:'red'}}>*</span></label>
                <input 
                  name="price" 
                  type="number" 
                  value={form.price} 
                  onChange={handleChange} 
                  className="form-control" 
                  placeholder="Nhập giá gốc"
                  min="0"
                  step="1000"
                  required 
                />
              </div>

              <div className="top-col">
                <label>Giá sale (VNĐ)</label>
                <input 
                  name="sale_price" 
                  type="number" 
                  value={form.sale_price} 
                  onChange={handleChange} 
                  className="form-control"
                  placeholder="Giá khuyến mãi (tùy chọn)"
                  min="0"
                  step="1000"
                />
                {form.sale_price && Number(form.sale_price) >= Number(form.price) && (
                  <small style={{color:'red'}}>Giá sale phải nhỏ hơn giá gốc</small>
                )}
              </div>

              <div className="top-col actions-col">
                <label style={{visibility:'hidden'}}>Lưu</label>
                <div className="top-actions">
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
                    disabled={saving || (form.sale_price && Number(form.sale_price) >= Number(form.price))}
                  >
                    {saving ? 'Đang lưu...' : (form.id ? 'Cập nhật' : 'Tạo mới')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ✅ TABLE hiển thị filteredPrices */}
      {!showForm && (
        <section className="promo-table-section">
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <div className="table-responsive">
              <table className="table price-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TOUR</th>
                    <th>LOẠI</th>
                    <th style={{ textAlign: 'right' }}>GIÁ GỐC</th>
                    <th style={{ textAlign: 'right' }}>GIÁ SALE</th>
                    <th style={{ textAlign: 'center', width:160 }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.length === 0 ? (
                    <tr><td colSpan="6" style={{textAlign:'center'}}>
                      {filters.search || filters.tour_id || filters.price_type || filters.sale_status || filters.price_min || filters.price_max
                        ? 'Không tìm thấy kết quả phù hợp'
                        : 'Không có mức giá nào'}
                    </td></tr>
                  ) : filteredPrices.map(p => {
                    const id = p.id ?? p._id;
                    const tid = String(p.tour_id ?? p.tourId ?? '');
                    const tourName = toursMap[tid] ?? `Tour #${tid}`;
                    
                    return (
                      <tr key={id ?? Math.random()}>
                        <td>{id}</td>
                        <td>{tourName}</td>
                        <td style={{ textAlign: 'center' }}>
                          {p.price_type === 'adult' ? 'Người lớn' : 
                           p.price_type === 'child' ? 'Trẻ em' : 
                           p.price_type ?? '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmtMoney(p.price)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {p.sale_price ? (
                            <span style={{color:'#e74c3c', fontWeight:'bold'}}>
                              {fmtMoney(p.sale_price)}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            onClick={() => openEdit(p)} 
                            style={{marginRight:8}}
                            title="Chỉnh sửa"
                          >
                            <i className="fas fa-edit"></i> Sửa
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => deletePrice(id)}
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i> Xóa
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
      )}
    </div>
  );
};

export default PriceTourManagement;