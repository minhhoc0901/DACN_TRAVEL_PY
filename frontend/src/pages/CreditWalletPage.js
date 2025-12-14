import React, { useState, useEffect } from 'react';
import { creditService } from '../services/creditService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/CreditWalletPage.css';

// ========== WITHDRAWAL MODAL COMPONENT ==========
const WithdrawalModal = ({ isOpen, onClose, balance, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const MIN_WITHDRAWAL = 50000;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const withdrawAmount = parseFloat(amount);

        if (!amount || withdrawAmount < MIN_WITHDRAWAL) {
            toast.error(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} VNĐ`);
            return;
        }

        if (withdrawAmount > balance) {
            toast.error('Số dư không đủ để thực hiện giao dịch');
            return;
        }

        if (!bankName || !accountNumber || !accountName) {
            toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                amount: withdrawAmount,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName
            });
            
            toast.success('Yêu cầu rút tiền đã được gửi thành công!');
            onClose();
            
            // Reset form
            setAmount('');
            setBankName('');
            setAccountNumber('');
            setAccountName('');
        } catch (error) {
            toast.error(error.message || 'Không thể tạo yêu cầu rút tiền');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="cv-modal-overlay" onClick={onClose}>
            <div className="cv-modal-content" onClick={e => e.stopPropagation()}>
                <div className="cv-modal-header">
                    <h3><i className="fas fa-money-bill-wave"></i> Rút tiền về ngân hàng</h3>
                    <button onClick={onClose} className="cv-modal-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="cv-modal-body">
                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            <i className="fas fa-coins"></i> Số tiền rút (VNĐ) *
                        </label>
                        <input
                            type="number"
                            className="cv-form-input"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Nhập số tiền muốn rút"
                            min={MIN_WITHDRAWAL}
                            max={balance}
                            required
                        />
                        <small className="cv-form-hint">
                            Số dư khả dụng: <strong>{balance.toLocaleString('vi-VN')} VNĐ</strong>
                        </small>
                    </div>

                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            <i className="fas fa-university"></i> Tên ngân hàng *
                        </label>
                        <input
                            type="text"
                            className="cv-form-input"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="VD: Vietcombank"
                            required
                        />
                    </div>

                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            <i className="fas fa-credit-card"></i> Số tài khoản *
                        </label>
                        <input
                            type="text"
                            className="cv-form-input"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Nhập số tài khoản"
                            required
                        />
                    </div>

                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            <i className="fas fa-user"></i> Tên chủ tài khoản *
                        </label>
                        <input
                            type="text"
                            className="cv-form-input"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Nhập tên chủ tài khoản"
                            required
                        />
                    </div>

                    <div className="cv-modal-footer">
                        <button type="button" onClick={onClose} className="cv-btn cv-btn-secondary">
                            <i className="fas fa-times"></i> Hủy
                        </button>
                        <button type="submit" disabled={submitting} className="cv-btn cv-btn-primary">
                            {submitting ? (
                                <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</>
                            ) : (
                                <><i className="fas fa-check"></i> Xác nhận rút tiền</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== MAIN COMPONENT ==========
const CreditWalletPage = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [balanceVisible, setBalanceVisible] = useState(false);
    
    // ✅ PHÂN TRANG STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // ✅ FILTER STATE
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch balance
            const balanceData = await creditService.getBalance();
            const balanceAmount = parseFloat(balanceData.data.balance) || 0;
            setBalance(balanceAmount);

            // Fetch transactions
            const transactionsData = await creditService.getTransactionHistory(100); // Lấy nhiều để phân trang ở client
            setTransactions(transactionsData.data || []);
            
            setError('');
        } catch (err) {
            console.error('[fetchData] Error:', err);
            setError(err.message || 'Không thể tải dữ liệu');
            toast.error('Không thể tải dữ liệu ví');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawal = async (withdrawalData) => {
        try {
            await creditService.requestWithdrawal(withdrawalData);
            await fetchData();
            setCurrentPage(1); // Reset về trang 1
        } catch (error) {
            throw error;
        }
    };

    const toggleBalanceVisibility = () => {
        setBalanceVisible(!balanceVisible);
    };

    const displayBalance = () => {
        return balanceVisible ? formatCurrency(balance) : '********';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0);
    };

    const getTransactionIcon = (type) => {
        const icons = {
            'refund': <i className="fas fa-plus-circle cv-icon-success"></i>,
            'payment': <i className="fas fa-minus-circle cv-icon-danger"></i>,
            'withdrawal': <i className="fas fa-arrow-right cv-icon-info"></i>
        };
        return icons[type] || <i className="fas fa-circle cv-icon-muted"></i>;
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            'refund': 'Hoàn tiền',
            'payment': 'Thanh toán',
            'withdrawal': 'Rút tiền'
        };
        return labels[type] || type;
    };

    const getWithdrawalStatusBadge = (status) => {
        const statusConfig = {
            'pending': { label: 'Chờ duyệt', className: 'cv-badge-pending', icon: 'bi-clock-history' },
            'approved': { label: 'Đã duyệt', className: 'cv-badge-approved', icon: 'bi-check-circle' },
            'rejected': { label: 'Từ chối', className: 'cv-badge-rejected', icon: 'bi-x-circle' },
            'completed': { label: 'Hoàn thành', className: 'cv-badge-completed', icon: 'bi-check-circle-fill' }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return (
            <span className={`cv-status-badge ${config.className}`}>
                <i className={`bi ${config.icon}`}></i>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ LỌC GIAO DỊCH THEO LOẠI
    const filteredTransactions = filterType === 'all' 
        ? transactions 
        : transactions.filter(tx => tx.transaction_type === filterType);

    // ✅ TÍNH TOÁN PHÂN TRANG
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    // ✅ XỬ LÝ CHUYỂN TRANG
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }
    };

    // ✅ TẠO DANH SÁCH SỐ TRANG
    const getPageNumbers = () => {
        const pages = [];
        const showPages = 5; // Số trang hiển thị

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (loading) {
        return (
            <div className="cv-credit-wallet-container">
                <div className="cv-loader-wrapper">
                    <div className="cv-loader"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cv-credit-wallet-container">
                <div className="cv-error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchData} className="cv-btn cv-btn-primary">
                        <i className="fas fa-sync-alt"></i> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />

            <WithdrawalModal
                isOpen={showWithdrawalModal}
                onClose={() => setShowWithdrawalModal(false)}
                balance={balance}
                onSubmit={handleWithdrawal}
            />

            <div className="cv-credit-wallet-container">
                {/* ========== PAGE HEADER ========== */}
                <div className="cv-page-header">
                    <div className="cv-header-content">
                        <h1><i className="fas fa-wallet"></i> Ví Credit của tôi</h1>
                        <p className="cv-subtitle">Quản lý số dư và lịch sử giao dịch</p>
                    </div>
                    <button onClick={fetchData} className="cv-btn-refresh">
                        <i className="fas fa-sync-alt"></i>
                        <span>Làm mới</span>
                    </button>
                </div>

                {/* ========== BALANCE CARD ========== */}
                <div className="cv-balance-card">
                    <div className="cv-balance-header">
                        <div className="cv-balance-icon">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <div className="cv-balance-info">
                            <p className="cv-balance-label">Số dư khả dụng</p>
                            <div className="cv-balance-amount-wrapper">
                                <h2 className="cv-balance-amount">
                                    {displayBalance()} {balanceVisible && 'VNĐ'}
                                </h2>
                                <button 
                                    onClick={toggleBalanceVisibility}
                                    className="cv-toggle-balance-btn"
                                    title={balanceVisible ? 'Ẩn số dư' : 'Hiện số dư'}
                                >
                                    <i className={`fas ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="cv-balance-actions">
                        <button 
                            onClick={() => setShowWithdrawalModal(true)} 
                            className="cv-btn cv-btn-primary"
                            disabled={balance < 50000}
                        >
                            <i className="fas fa-money-bill-wave"></i>
                            <span>Rút tiền</span>
                        </button>
                    </div>
                    {balance < 50000 && (
                        <div className="cv-balance-warning">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>Số dư tối thiểu để rút tiền là 50.000 VNĐ</p>
                        </div>
                    )}
                </div>

                {/* ========== TRANSACTION HISTORY ========== */}
                <div className="cv-transactions-section">
                    <div className="cv-transactions-header">
                        <div className="cv-transactions-title">
                            <h3><i className="fas fa-history"></i> Lịch sử giao dịch</h3>
                            {filteredTransactions.length > 0 && (
                                <span className="cv-transactions-count">
                                    {filteredTransactions.length} giao dịch
                                </span>
                            )}
                        </div>
                        
                        {/* ========== FILTER BUTTONS ========== */}
                        <div className="cv-transaction-filters">
                            <button 
                                className={`cv-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('all');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="fas fa-list"></i>
                                Tất cả
                            </button>
                            <button 
                                className={`cv-filter-btn ${filterType === 'refund' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('refund');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="fas fa-plus-circle"></i>
                                Hoàn tiền
                            </button>
                            <button 
                                className={`cv-filter-btn ${filterType === 'payment' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('payment');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="fas fa-minus-circle"></i>
                                Thanh toán
                            </button>
                            <button 
                                className={`cv-filter-btn ${filterType === 'withdrawal' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilterType('withdrawal');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="fas fa-arrow-right"></i>
                                Rút tiền
                            </button>
                        </div>
                    </div>
                    
                    {currentTransactions.length === 0 ? (
                        <div className="cv-empty-state">
                            <i className="fas fa-inbox"></i>
                            <p>Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <>
                            {/* ========== TRANSACTIONS LIST ========== */}
                            <div className="cv-transactions-list">
                                {currentTransactions.map(transaction => (
                                    <div key={transaction.id} className="cv-transaction-item">
                                        <div className="cv-transaction-icon">
                                            {getTransactionIcon(transaction.transaction_type)}
                                        </div>
                                        <div className="cv-transaction-details">
                                            <div className="cv-transaction-header">
                                                <p className="cv-transaction-type">
                                                    {getTransactionTypeLabel(transaction.transaction_type)}
                                                </p>
                                                {transaction.transaction_type === 'withdrawal' && transaction.withdrawal_status && (
                                                    getWithdrawalStatusBadge(transaction.withdrawal_status)
                                                )}
                                            </div>
                                            
                                            <p className="cv-transaction-description">
                                                {transaction.description}
                                            </p>
                                            
                                            {transaction.transaction_type === 'withdrawal' && transaction.bank_info && (
                                                <div className="cv-bank-info">
                                                    <div className="cv-bank-detail">
                                                        <i className="bi bi-bank"></i>
                                                        <span>{transaction.bank_info.bank_name}</span>
                                                    </div>
                                                    <div className="cv-bank-detail">
                                                        <i className="bi bi-credit-card"></i>
                                                        <span>{transaction.bank_info.account_number}</span>
                                                    </div>
                                                    <div className="cv-bank-detail">
                                                        <i className="bi bi-person"></i>
                                                        <span>{transaction.bank_info.account_name}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {transaction.admin_notes && (
                                                <div className="cv-admin-note">
                                                    <i className="bi bi-info-circle"></i>
                                                    <span>Ghi chú: {transaction.admin_notes}</span>
                                                </div>
                                            )}

                                            <p className="cv-transaction-date">
                                                <i className="far fa-clock"></i> {formatDate(transaction.created_at)}
                                            </p>
                                        </div>
                                        <div className="cv-transaction-amount">
                                            <span className={transaction.amount >= 0 ? 'cv-text-success' : 'cv-text-danger'}>
                                                {transaction.amount >= 0 ? '+' : ''}
                                                {formatCurrency(Math.abs(transaction.amount))} VNĐ
                                            </span>
                                            <span className="cv-balance-after">
                                                Số dư: {formatCurrency(transaction.balance_after)} VNĐ
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ========== PAGINATION ========== */}
                            {totalPages > 1 && (
                                <div className="cv-pagination">
                                    <button 
                                        className="cv-pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        title="Trang trước"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    
                                    <div className="cv-pagination-numbers">
                                        {getPageNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <span key={`dots-${index}`} className="cv-pagination-dots">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    className={`cv-pagination-number ${page === currentPage ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button 
                                        className="cv-pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        title="Trang sau"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}

                            {/* ========== PAGINATION INFO ========== */}
                            <div className="cv-pagination-info">
                                Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredTransactions.length)} 
                                {' '}trong tổng số {filteredTransactions.length} giao dịch
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CreditWalletPage;