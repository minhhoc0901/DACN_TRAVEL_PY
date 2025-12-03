import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../../../styles/Refund/RefundDetailModal.css';

const RefundDetailModal = ({ 
    refund, 
    onClose, 
    onApprove, 
    onReject,
    onCompleteBankTransfer // ✅ THÊM PROP
}) => {
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showCompleteTransferForm, setShowCompleteTransferForm] = useState(false); // ✅ THÊM STATE
    const [adminNote, setAdminNote] = useState(''); // ✅ SỬA: adminNotes → adminNote
    const [transactionRef, setTransactionRef] = useState(''); // ✅ THÊM STATE
    const [submitting, setSubmitting] = useState(false);

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(num);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    // ✅ SỬA: Chỉ truyền adminNote (string) thay vì object
    const handleApprove = async (e) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            await onApprove(refund.id, adminNote);
        } catch (error) {
            toast.error(error.message || 'Không thể duyệt yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ SỬA: Chỉ truyền adminNote (string) thay vì object
    const handleReject = async (e) => {
        e.preventDefault();

        if (!adminNote.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        setSubmitting(true);
        try {
            await onReject(refund.id, adminNote);
        } catch (error) {
            toast.error(error.message || 'Không thể từ chối yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ THÊM: Handler hoàn thành bank transfer
    const handleCompleteBankTransfer = async (e) => {
        e.preventDefault();

        if (!transactionRef.trim()) {
            toast.error('Vui lòng nhập mã giao dịch');
            return;
        }

        setSubmitting(true);
        try {
            await onCompleteBankTransfer(refund.id, transactionRef);
        } catch (error) {
            toast.error(error.message || 'Không thể hoàn thành chuyển khoản');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content refund-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        <i className="bi bi-arrow-return-left"></i>
                        Chi tiết yêu cầu hoàn tiền #{refund.id}
                    </h3>
                    <button onClick={onClose} className="btn-close">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Thông tin booking */}
                    <div className="info-section">
                        <h4><i className="bi bi-calendar-check"></i> Thông tin booking</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Booking ID:</label>
                                <span><strong>#{refund.booking_id}</strong></span>
                            </div>
                            <div className="info-item">
                                <label>Tour:</label>
                                <span>{refund.tour_name}</span>
                            </div>
                            <div className="info-item">
                                <label>Ngày khởi hành:</label>
                                <span>{formatDate(refund.departure_date)}</span>
                            </div>
                            <div className="info-item">
                                <label>Số tiền booking:</label>
                                <span><strong>{formatCurrency(refund.booking_amount)}</strong></span>
                            </div>
                            <div className="info-item">
                                <label>Trạng thái booking:</label>
                                <span className="badge badge-secondary">{refund.booking_status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin khách hàng */}
                    <div className="info-section">
                        <h4><i className="bi bi-person"></i> Thông tin khách hàng</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Họ tên:</label>
                                <span><strong>{refund.full_name || refund.contact_name}</strong></span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{refund.user_email || refund.contact_email}</span>
                            </div>
                            <div className="info-item">
                                <label>Số điện thoại:</label>
                                <span>{refund.contact_phone}</span>
                            </div>
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{refund.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin hoàn tiền */}
                    <div className="info-section highlight-section">
                        <h4><i className="bi bi-cash-stack"></i> Thông tin hoàn tiền</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Phần trăm hoàn:</label>
                                <span className="refund-percent-badge">{refund.refund_percent}%</span>
                            </div>
                            <div className="info-item">
                                <label>Số tiền hoàn:</label>
                                <span className="refund-amount-large">{formatCurrency(refund.refund_amount)}</span>
                            </div>
                            <div className="info-item">
                                <label>Phương thức:</label>
                                <span>
                                    {refund.refund_method === 'credit' ? (
                                        <span className="badge badge-secondary">
                                            <i className="bi bi-wallet2"></i> Ví Credit
                                        </span>
                                    ) : (
                                        <span className="badge badge-info">
                                            <i className="bi bi-bank"></i> Chuyển khoản
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Phí xử lý:</label>
                                <span className="text-danger">{formatCurrency(refund.processing_fee || 0)}</span>
                            </div>
                            <div className="info-item full-width">
                                <label>Lý do hoàn tiền:</label>
                                <span className="refund-reason">{refund.refund_reason}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin xử lý */}
                    <div className="info-section">
                        <h4><i className="bi bi-gear"></i> Thông tin xử lý</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Trạng thái:</label>
                                <span>
                                    {refund.refund_status === 'pending' && <span className="badge badge-warning">⏳ Chờ duyệt</span>}
                                    {refund.refund_status === 'processing' && <span className="badge badge-info">⏳ Đang xử lý</span>}
                                    {refund.refund_status === 'approved' && <span className="badge badge-success">✅ Đã duyệt</span>}
                                    {refund.refund_status === 'rejected' && <span className="badge badge-danger">❌ Từ chối</span>}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Ngày tạo:</label>
                                <span>{formatDate(refund.created_at)}</span>
                            </div>
                            {refund.processed_at && (
                                <div className="info-item">
                                    <label>Ngày xử lý:</label>
                                    <span>{formatDate(refund.processed_at)}</span>
                                </div>
                            )}
                            {refund.approved_at && (
                                <div className="info-item">
                                    <label>Ngày duyệt:</label>
                                    <span>{formatDate(refund.approved_at)}</span>
                                </div>
                            )}
                            {refund.processed_by_username && (
                                <div className="info-item">
                                    <label>Người xử lý:</label>
                                    <span><strong>{refund.processed_by_username}</strong></span>
                                </div>
                            )}
                            {refund.admin_note && (
                                <div className="info-item full-width">
                                    <label>Ghi chú admin:</label>
                                    <span className="admin-notes">{refund.admin_note}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ ACTION BUTTONS - PENDING */}
                    {refund.refund_status === 'pending' && !showApproveForm && !showRejectForm && (
                        <div className="action-buttons">
                            <button
                                onClick={() => setShowApproveForm(true)}
                                className="btn btn-success"
                            >
                                <i className="bi bi-check-circle"></i> Duyệt yêu cầu
                            </button>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="btn btn-danger"
                            >
                                <i className="bi bi-x-circle"></i> Từ chối
                            </button>
                        </div>
                    )}

                    {/* ✅ ACTION BUTTONS - PROCESSING (Bank Transfer) */}
                    {refund.refund_status === 'processing' && 
                     refund.refund_method === 'bank_transfer' && 
                     !showCompleteTransferForm && (
                        <div className="action-buttons">
                            <div className="alert alert-info">
                                <i className="bi bi-info-circle"></i>
                                <p>Yêu cầu đã được duyệt. Vui lòng chuyển khoản <strong>{formatCurrency(refund.refund_amount)}</strong> cho khách hàng, sau đó nhập mã giao dịch để hoàn tất.</p>
                            </div>
                            <button
                                onClick={() => setShowCompleteTransferForm(true)}
                                className="btn btn-primary"
                            >
                                <i className="bi bi-check2-circle"></i> Hoàn thành chuyển khoản
                            </button>
                        </div>
                    )}

                    {/* ✅ FORM DUYỆT */}
                    {showApproveForm && (
                        <form onSubmit={handleApprove} className="approve-form">
                            <h4>Duyệt yêu cầu hoàn tiền</h4>
                            
                            {refund.refund_method === 'credit' && (
                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle"></i>
                                    <p>Khi duyệt, hệ thống sẽ tự động cộng <strong>{formatCurrency(refund.refund_amount)}</strong> vào ví Credit của user.</p>
                                </div>
                            )}

                            {refund.refund_method === 'bank_transfer' && (
                                <div className="alert alert-warning">
                                    <i className="bi bi-exclamation-triangle"></i>
                                    <p>Sau khi duyệt, bạn cần chuyển khoản <strong>{formatCurrency(refund.refund_amount)}</strong> cho khách hàng và nhập mã giao dịch.</p>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Ghi chú</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Ghi chú của admin (không bắt buộc)..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowApproveForm(false)}
                                    className="btn btn-secondary"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ✅ FORM TỪ CHỐI */}
                    {showRejectForm && (
                        <form onSubmit={handleReject} className="reject-form">
                            <h4>Từ chối yêu cầu hoàn tiền</h4>
                            
                            <div className="form-group">
                                <label>Lý do từ chối <span className="required">*</span></label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Nhập lý do từ chối..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectForm(false)}
                                    className="btn btn-secondary"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-danger"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ✅ FORM HOÀN THÀNH BANK TRANSFER */}
                    {showCompleteTransferForm && (
                        <form onSubmit={handleCompleteBankTransfer} className="complete-transfer-form">
                            <h4>Hoàn thành chuyển khoản</h4>
                            
                            <div className="alert alert-success">
                                <i className="bi bi-check-circle"></i>
                                <p>Xác nhận bạn đã chuyển khoản <strong>{formatCurrency(refund.refund_amount)}</strong> cho khách hàng</p>
                            </div>

                            <div className="form-group">
                                <label>Mã giao dịch <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    placeholder="VD: TXN-20240123-456789"
                                    required
                                />
                                <small className="text-muted">Nhập mã giao dịch từ ngân hàng sau khi chuyển khoản thành công</small>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowCompleteTransferForm(false)}
                                    className="btn btn-secondary"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Xác nhận hoàn thành'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundDetailModal;