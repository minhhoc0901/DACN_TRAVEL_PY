import React, { useEffect, useState } from 'react';
import { promotionService } from '../../services/promotionService';
import '../../styles/admin/PromotionManagement.css';

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  start_date: '',
  end_date: '',
  max_usage: null,
  is_active: true
};

const fmtDate = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d)) return String(val);
    return d.toLocaleString();
  } catch {
    return String(val);
  }
};

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadPromotions(); }, []);

  async function loadPromotions() {
    setLoading(true);
    try {
      const data = await promotionService.getAllPromotions();
      const list = Array.isArray(data) ? data : (data.items || data.rows || data.data || []);
      setPromotions(list);
    } catch (err) {
      console.error('[PromotionManagement] loadPromotions error:', err);
      alert('Không thể tải danh sách khuyến mãi: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'discount_value' || name === 'max_usage' ? (value === '' ? null : Number(value)) : value)
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value || 0),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        max_usage: form.max_usage === null ? null : Number(form.max_usage),
        is_active: !!form.is_active
      };
      if (editingId) {
        await promotionService.updatePromotion(editingId, payload);
        alert('Cập nhật thành công');
      } else {
        await promotionService.createPromotion(payload);
        alert('Tạo khuyến mãi thành công');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadPromotions();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu khuyến mãi: ' + (err.message || ''));
    }
  }

  function onEdit(p) {
    setEditingId(p.id ?? p._id ?? null);
    setForm({
      code: p.code ?? '',
      description: p.description ?? '',
      discount_type: p.discount_type ?? (p.discount_value != null ? 'percentage' : 'fixed_amount'),
      discount_value: p.discount_value ?? p.discount ?? 0,
      start_date: p.start_date ? String(p.start_date).slice(0,10) : '',
      end_date: p.end_date ? String(p.end_date).slice(0,10) : '',
      max_usage: p.max_usage ?? null,
      is_active: p.is_active ?? p.active ?? true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onDelete(id) {
    if (!window.confirm('Xóa khuyến mãi này?')) return;
    try {
      await promotionService.deletePromotion(id);
      alert('Đã xóa');
      await loadPromotions();
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại: ' + (err.message || ''));
    }
  }

  // HÀM TRỢ GIÚP: Kiểm tra trạng thái thực tế
  const getActualStatus = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);

    if (now < startDate) {
      return { text: 'Chưa bắt đầu', className: 'status-disabled', icon: 'bi-clock' };
    }
    if (now > endDate) {
      return { text: 'Đã hết hạn', className: 'status-expired', icon: 'bi-exclamation-circle' };
    }
    if (!promo.is_active) {
      return { text: 'Vô hiệu hóa', className: 'status-disabled', icon: 'bi-x-circle' };
    }
    return { text: 'Đang hoạt động', className: 'status-active', icon: 'bi-check-circle' };
  };

  return (
    <div className="admin-page promotion-page">
      <h1 className="page-title">Quản lý khuyến mãi</h1>

      <section className="promo-form-section">
        <form onSubmit={onSubmit} className="promo-form">
          <input name="code" className="form-control" placeholder="Mã" value={form.code} onChange={onChange} required />
          <input name="description" className="form-control" placeholder="Mô tả" value={form.description} onChange={onChange} />
          <select name="discount_type" className="form-control" value={form.discount_type} onChange={onChange}>
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed_amount">Số tiền (VNĐ)</option>
          </select>
          <input name="discount_value" className="form-control small-input" type="number" min="0" step="0.01" placeholder="Giá trị giảm" value={form.discount_value ?? ''} onChange={onChange} />
          <input name="start_date" className="form-control small-input" type="date" value={form.start_date} onChange={onChange} />
          <input name="end_date" className="form-control small-input" type="date" value={form.end_date} onChange={onChange} />
          <input name="max_usage" className="form-control small-input" type="number" min="0" placeholder="Số lần tối đa (null)" value={form.max_usage ?? ''} onChange={onChange} />
          <label className="form-checkbox">
            <input name="is_active" type="checkbox" checked={form.is_active} onChange={onChange} /> Kích hoạt
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy</button>}
          </div>
        </form>
      </section>

      <section className="promo-table-section">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="table-responsive">
            <table className="table promotion-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mã</th>
                  <th>Mô tả</th>
                  <th>Loại</th>
                  <th>Giảm</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Số lượng tối đa</th>
                  <th>Đã dùng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 && (
                  <tr><td colSpan="11">Không có khuyến mãi</td></tr>
                )}
                {promotions.map(p => {
                  const status = getActualStatus(p);
                  return (
                    <tr key={p.id ?? p._id}>
                      <td>{p.id ?? p._id}</td>
                      <td>{p.code}</td>
                      <td>{p.description}</td>
                      <td style={{ textAlign: 'center' }}>{p.discount_type ?? '-'}</td>
                      <td style={{ textAlign: 'center' }}>{p.discount_value ?? p.discount ?? '-'}</td>
                      <td style={{ textAlign: 'center' }}>{fmtDate(p.start_date)}</td>
                      <td style={{ textAlign: 'center' }}>{fmtDate(p.end_date)}</td>
                      <td style={{ textAlign: 'center' }}>{p.max_usage ?? '∞'}</td>
                      <td style={{ textAlign: 'center' }}>{p.usage_count ?? 0}</td>
                      
                      {/* HIỂN THỊ TRẠNG THÁI THỰC TẾ */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${status.className}`}>
                          <i className={`bi ${status.icon}`} style={{ marginRight: '6px' }}></i>
                          {status.text}
                        </span>
                      </td>
                      
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(p)} style={{ marginRight: 8 }}>Sửa</button>
                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(p.id ?? p._id)}>Xóa</button>
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

export default PromotionManagement;