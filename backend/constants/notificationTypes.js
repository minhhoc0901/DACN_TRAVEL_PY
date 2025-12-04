const NOTIFICATION_TYPES = {
  // System
  SYSTEM: 'system',
  
  // Booking
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  
  // Payment
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',

  // Refund
  REFUND_PENDING: 'refund_pending',
  REFUND_APPROVED: 'refund_approved',
  REFUND_REJECTED: 'refund_rejected',
  REFUND_COMPLETED: 'refund_completed',
  ADMIN_NEW_REFUND: 'admin_new_refund',

  // THÊM: Withdrawal (Rút tiền)
  WITHDRAWAL_PENDING: 'withdrawal_pending',
  WITHDRAWAL_APPROVED: 'withdrawal_approved',
  WITHDRAWAL_REJECTED: 'withdrawal_rejected',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  ADMIN_NEW_WITHDRAWAL: 'admin_new_withdrawal',
  
  // Tour
  TOUR_PENDING: 'tour_pending',
  TOUR_APPROVED: 'tour_approved',
  TOUR_REJECTED: 'tour_rejected',
  TOUR_UPDATE: 'tour_update',
  
  // Review & Comment
  NEW_REVIEW: 'new_review',
  NEW_LOCATION_COMMENT: 'new_location_comment',
  
  // Message
  NEW_MESSAGE: 'new_message',
  ADMIN_NEW_BOOKING: 'admin_new_booking',
  ADMIN_PAYMENT_SUCCESS: 'admin_new_payment'
};

module.exports = NOTIFICATION_TYPES;