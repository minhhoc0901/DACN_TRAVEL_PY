const { GoogleGenerativeAI } = require('@google/generative-ai');
const Location = require('../models/Location');
const Tour = require('../models/Tour');


// Tạo fallback function cho trường hợp API không hoạt động
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  // General greetings
  if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('xin chào') || lowerMsg.includes('chào')) {
    return "Xin chào! Tôi là trợ lý du lịch Phú Yên. Tôi có thể giúp bạn tìm hiểu về các địa điểm du lịch, đề xuất lịch trình hoặc tư vấn thời điểm tốt nhất để đi Phú Yên.";
  }
  
  // Weather inquiries
  if (lowerMsg.includes('thời tiết')) {
    return "Thời tiết ở Phú Yên thường rất đẹp từ tháng 2 đến tháng 8, với nhiệt độ từ 25-32°C. Đây là thời gian lý tưởng để tham quan các địa điểm ngoài trời. Mùa mưa thường bắt đầu từ tháng 9 đến tháng 1.";
  }
  
  // Popular destinations
  if (lowerMsg.includes('gành đá đĩa') || lowerMsg.includes('ganh da dia')) {
    return "Gành Đá Đĩa (ID: 1) là một trong những địa điểm nổi tiếng nhất của Phú Yên. Đây là một thắng cảnh thiên nhiên độc đáo với những khối đá bazan hình lục giác xếp chồng lên nhau như những chồng đĩa khổng lồ. Địa điểm này nằm ở xã An Ninh Đông, huyện Tuy An, cách thành phố Tuy Hòa khoảng 30km.";
  }
  
  if (lowerMsg.includes('bãi xép') || lowerMsg.includes('bai xep')) {
    return "Bãi Xép (ID: 2) là một bãi biển đẹp hoang sơ nằm cách thành phố Tuy Hòa khoảng 14km về phía nam. Bãi biển nổi tiếng với cát trắng mịn, nước biển trong xanh và những tảng đá lớn. Đây cũng là địa điểm quay phim 'Tôi thấy hoa vàng trên cỏ xanh'.";
  }
  
  if (lowerMsg.includes('mũi điện') || lowerMsg.includes('mui dien')) {
    return "Mũi Điện (ID: 3) là điểm cực Đông của đất liền Việt Nam, nơi đón ánh bình minh đầu tiên trên đất liền. Ngọn hải đăng Mũi Điện được xây dựng từ thời Pháp, là điểm tham quan hấp dẫn du khách với khung cảnh biển tuyệt đẹp và bình minh ngoạn mục.";
  }
  
  // Tours
  if (lowerMsg.includes('tour') || lowerMsg.includes('chuyến đi')) {
    return "Phú Yên Travel có nhiều tour du lịch đa dạng. Tour phổ biến nhất là tour 3 ngày 2 đêm khám phá các điểm đến nổi tiếng như Gành Đá Đĩa, Bãi Xép, Đầm Ô Loan, và Mũi Điện. Chúng tôi cũng có các tour ngắn ngày và tour theo yêu cầu.";
  }
  
  // Best time to visit
  if (lowerMsg.includes('khi nào') || lowerMsg.includes('thời gian') || lowerMsg.includes('mùa')) {
return "Thời điểm lý tưởng để du lịch Phú Yên là từ tháng 2 đến tháng 8 khi thời tiết khô ráo, ít mưa. Đặc biệt, tháng 4 đến tháng 6 là mùa đẹp nhất với nhiệt độ dễ chịu và ít du khách. Nếu bạn muốn ngắm hoa vàng trên cỏ xanh, hãy đến vào tháng 3.";
  }
  
  // Default response
  return "Xin chào! Tôi là trợ lý du lịch Phú Yên. Tôi có thể giúp bạn tìm hiểu về các địa điểm du lịch như Gành Đá Đĩa, Bãi Xép, Mũi Điện, hoặc tư vấn khi nào nên đi Phú Yên (thời điểm lý tưởng là từ tháng 2-8). Bạn cần tư vấn gì về chuyến du lịch Phú Yên?";
}

class ChatbotService {
  static async processMessage(userId, message) {
    try {
      // Kích hoạt Gemini API thay vì luôn sử dụng fallback
      console.log('Processing message:', message);
      
      // Lấy dữ liệu địa điểm và tour để tạo context cho AI
      const [locationData, tourData, weatherPrompt] = await Promise.all([
        this.getLocationData(),
        this.getTourData(),
        this.getWeatherPrompt()
      ]);
      
      // Tạo system prompt từ dữ liệu
      const systemPrompt = this.generateSystemPrompt(locationData, tourData, weatherPrompt);
      
      // Gọi Gemini API với system prompt và tin nhắn của người dùng
      const response = await this.callGeminiAPI(systemPrompt, message);
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return getFallbackResponse(message); // Sử dụng fallback nếu có lỗi
    }
  }

  static async listAvailableModels() {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const result = await genAI.listModels();
      console.log('Available models:', result);
      return result;
    } catch (error) {
      console.error('Error listing models:', error);
      return null;
    }
  }

  static async getTourData() {
    try {
      const tours = await Tour.getAllTours();
      return tours.slice(0, 5).map(tour => ({
        id: tour.id,
        destination: tour.destination,
        duration: tour.duration,
        description: tour.description?.slice(0, 100) + '...'
      }));
    } catch (error) {
      console.error('Error fetching tour data:', error);
      return [];
    }
  }

  static async getLocationData() {
    try {
      const locations = await Location.getAllLocations();
      return locations.slice(0, 10).map(location => ({
        id: location.id,
        name: location.title || location.name,
        type: location.type,
        description: location.description?.slice(0, 100) + '...'
      }));
    } catch (error) {
      console.error('Error fetching location data:', error);
      return [];
    }
  }

  static async getWeatherPrompt() {
    try {
      return `
      Phú Yên có khí hậu nhiệt đới gió mùa. 
      Mùa khô từ tháng 1-8, thích hợp cho du lịch biển. 
      Mùa mưa từ tháng 9-12, đôi khi có bão. 
      Thời điểm đẹp nhất để du lịch là từ tháng 2 đến tháng 8.
      `;
    } catch (error) {
      console.error('Error creating weather prompt:', error);
      return '';
    }
  }

  static generateSystemPrompt(locationData, tourData, weatherPrompt) {
    let locationsText = '';
    locationData.forEach(loc => {
      locationsText += `- ${loc.name} (ID: ${loc.id}): ${loc.type}. ${loc.description}\n`;
    });

    let toursText = '';
    tourData.forEach(tour => {
      toursText += `- Tour ${tour.id}: ${tour.destination} (${tour.duration}). ${tour.description}\n`;
    });

    return `
    Bạn là trợ lý du lịch ảo chuyên về Phú Yên, được tạo bởi Phú Yên Travel.
    
    THÔNG TIN ĐỊA ĐIỂM:
    ${locationsText}
    
    THÔNG TIN TOUR:
    ${toursText}
    
    THỜI TIẾT PHÚ YÊN:
    ${weatherPrompt}
    
    LƯU Ý KHI DU LỊCH:
    - Mang theo kem chống nắng khi đi biển
    - Theo dõi dự báo thời tiết trước khi đi
    - Thuê xe máy là phương tiện thuận tiện nhất để khám phá Phú Yên
    - Các quán ăn thường đóng cửa sớm (trước 21:00)
    
    HƯỚNG DẪN TRẢ LỜI:
    - Trả lời ngắn gọn, thân thiện và hữu ích
    - Trả lời bằng tiếng Việt, có dấu đầy đủ
    - Nếu được hỏi về địa điểm, hãy đề cập đến ID để người dùng có thể dễ dàng tìm kiếm
    - Đề xuất địa điểm dựa vào thời tiết: khi trời đẹp thì đề xuất Gành Đá Đĩa, Bãi Xép; khi trời mưa thì đề xuất các điểm tham quan trong nhà
    - Đề xuất thời gian du lịch tốt nhất là từ tháng 2-8
    - Luôn trả lời trong vai trò là trợ lý du lịch Phú Yên
    `;
  }

  static async callGeminiAPI(systemPrompt, userMessage) {
    // BƯỚC 1: Đọc và kiểm tra API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('LỖI: Không tìm thấy GEMINI_API_KEY. Vui lòng kiểm tra file .env và đảm bảo app.js đã gọi dotenv.config() ở dòng đầu tiên.');
      return getFallbackResponse(userMessage);
    }
    console.log('INFO: Đã tìm thấy API Key.');

    const genAI = new GoogleGenerativeAI(API_KEY);
    const prompt = `${systemPrompt}\n\nNgười dùng hỏi: ${userMessage}\n\nTrả lời:`;

    // Danh sách các model để thử theo thứ tự ưu tiên
    const modelsToTry = [
      "gemini-2.5-flash-legacy",
      "gemini-1.5-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash", 
      "gemini-pro"        
    ];

    // BƯỚC 2: Lần lượt thử các model trong danh sách
    for (const modelName of modelsToTry) {
      try {
        console.log(`INFO: Đang thử model: "${modelName}"...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim() !== "") {
          console.log(`THÀNH CÔNG: Model "${modelName}" đã phản hồi.`);
          return text; // Trả về kết quả thành công
        }
        
        // Nếu API trả về rỗng
        console.warn(`CẢNH BÁO: Model "${modelName}" trả về nội dung rỗng.`);

      } catch (error) {
        // Nếu có lỗi với model hiện tại
        console.error(`LỖI với model "${modelName}":`, error.message);
        
        // Nếu lỗi là do giới hạn quota, dừng lại ngay
        if (error.message.includes('429')) {
            console.log('LỖI: API bị giới hạn quota (Rate Limit). Chuyển sang dùng fallback.');
            return getFallbackResponse(userMessage);
        }
        // Nếu lỗi khác (vd: model not found), vòng lặp sẽ tự động thử model tiếp theo
      }
    }

    // BƯỚC 3: Nếu tất cả các model đều thất bại
    console.error('LỖI: Tất cả các model đều thất bại. Sử dụng fallback response.');
    return getFallbackResponse(userMessage);
  }

}

module.exports = ChatbotService;
