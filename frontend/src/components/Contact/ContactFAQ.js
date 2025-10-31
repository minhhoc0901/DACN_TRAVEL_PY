import React, { useState } from 'react';
import '../../styles/Contact/ContactFAQ.css';
import { useChat } from '../../contexts/ChatContext';

const faqs = [
  {
    id: 1,
    question: "Làm thế nào để tạo lịch trình du lịch cá nhân?",
    answer: "Bạn có thể tạo lịch trình bằng cách chọn các điểm đến, ngày đi và các hoạt động mong muốn trên website. Hệ thống sẽ giúp bạn lên kế hoạch chi tiết."
  },
  {
    id: 2,
    question: "Tôi có thể thay đổi lịch trình sau khi đã tạo không?",
    answer: "Bạn hoàn toàn có thể chỉnh sửa, thêm hoặc xóa các điểm đến, hoạt động trong lịch trình bất cứ lúc nào trước chuyến đi."
  },
  {
    id: 3,
    question: "Có thể chia sẻ lịch trình với bạn bè hoặc gia đình không?",
    answer: "Bạn có thể chia sẻ lịch trình qua email, mạng xã hội hoặc gửi liên kết trực tiếp cho bạn bè, người thân."
  },
  {
    id: 4,
    question: "Những phương thức thanh toán nào được hỗ trợ cho các dịch vụ bổ sung?",
    answer: "Chúng tôi hỗ trợ thanh toán qua chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ, ví điện tử (Momo, ZaloPay) và tiền mặt tại văn phòng."
  },
  {
    id: 5,
    question: "Nếu có thắc mắc khác thì làm sao?",
    answer: "Bạn có thể liên hệ với chúng tôi qua chatbot, hotline hoặc email để được hỗ trợ nhanh chóng."
  }
];

const ContactFAQ = () => {
  const [activeId, setActiveId] = useState(null);
  const { toggleChat, isChatOpen } = useChat(); // Lấy hàm toggleChat và trạng thái isChatOpen từ context

  const handleOpenChat = (e) => {
    e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a> nếu bạn vẫn dùng thẻ <a>
    if (!isChatOpen) { // Chỉ toggle nếu chat chưa mở, hoặc bạn có thể luôn toggle
      toggleChat();
    }
    // Nếu bạn muốn cuộn đến chatbot hoặc làm gì đó khác khi chat đã mở, thêm logic ở đây
  };

  return (
    <section className="faq-section">
      <div className="container">
        <div className="faq-header">
          <div className="section-badge">FAQ</div>
          <h2>Câu hỏi thường gặp</h2>
          <p>Tìm câu trả lời nhanh cho những thắc mắc phổ biến nhất</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className={`faq-item ${activeId === faq.id ? 'active' : ''}`}
              onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-icon">
                  <i className={`bi bi-chevron-${activeId === faq.id ? 'up' : 'down'}`}></i>
                </span>
              </div>
              <div className="faq-answer">
                {faq.answer.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="faq-footer">
          <p>Không tìm thấy câu trả lời bạn cần?</p>
          {/* Thay thế thẻ <a> bằng một button hoặc div để gọi chatbot */}
          <button onClick={handleOpenChat} className="btn-contact">
            Hỏi Chatbot của chúng tôi
            <i className="bi bi-robot"></i> {/* Thay icon nếu muốn */}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContactFAQ;