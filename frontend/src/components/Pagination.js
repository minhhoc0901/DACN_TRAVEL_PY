import React from 'react';
import '../styles/Pagination.css';

const Pagination = ({ pagination, onPageChange }) => {
    const { page, totalPages, hasNext, hasPrev } = pagination;

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <nav className="pagination-container">
            <ul className="pagination">
                {/* Previous button */}
                <li className={`page-item ${!hasPrev ? 'disabled' : ''}`}>
                    <button 
                        className="page-link"
                        onClick={() => onPageChange(page - 1)}
                        disabled={!hasPrev}
                    >
                        <i className="fas fa-chevron-left"></i>
                        <span className="d-none d-sm-inline ms-1">Trước</span>
                    </button>
                </li>

                {/* First page */}
                {page > 3 && (
                    <>
                        <li className="page-item">
                            <button className="page-link" onClick={() => onPageChange(1)}>
                                1
                            </button>
                        </li>
                        {page > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                    </>
                )}

                {/* Page numbers */}
                {getPageNumbers().map(pageNum => (
                    <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
                        <button 
                            className="page-link"
                            onClick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </button>
                    </li>
                ))}

                {/* Last page */}
                {page < totalPages - 2 && (
                    <>
                        {page < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                        <li className="page-item">
                            <button className="page-link" onClick={() => onPageChange(totalPages)}>
                                {totalPages}
                            </button>
                        </li>
                    </>
                )}

                {/* Next button */}
                <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
                    <button 
                        className="page-link"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNext}
                    >
                        <span className="d-none d-sm-inline me-1">Tiếp</span>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;