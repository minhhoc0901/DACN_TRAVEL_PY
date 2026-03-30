/**
 * Chứa các cấu hình chung cho ứng dụng Frontend.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const CONFIG = {
  API_URL: API_BASE_URL,
  API_API_URL: `${API_BASE_URL}/api`,
};

export default CONFIG;
