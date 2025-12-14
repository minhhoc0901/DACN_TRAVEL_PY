
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
// import "./WeatherSection.css";
import '../../styles/LocationCSS/WeatherSection.css'; // Import your CSS file here

const WeatherSection = ({ weatherData, weatherError, location }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("current");

  // Use environment variables for API keys
  const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || "095cde61e730fd9406235de1237e97c1";

  useEffect(() => {
    if (activeTab === "forecast" && location?.coordinates) {
      fetchForecast();
    }
  }, [activeTab, location]);

  const fetchForecast = async () => {
    if (!location?.coordinates) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${location.coordinates.latitude}&lon=${location.coordinates.longitude}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`
      );

      // Nhóm dữ liệu theo ngày
      const dailyForecasts = {};
      response.data.list.forEach((item) => {
        const dateObj = new Date(item.dt * 1000);
        // Store date key in YYYY-MM-DD format for reliable parsing later
        const dateKey = dateObj.toISOString().split('T')[0]; 

        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = [];
        }
        dailyForecasts[dateKey].push(item);
      });

      setForecast(dailyForecasts);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dự báo thời tiết:", err);
      setError("Không thể tải dữ liệu dự báo thời tiết.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeatherIcon = (code) => {
    return `http://openweathermap.org/img/w/${code}.png`;
  };

  // Wind direction text
  const getWindDirection = (degrees) => {
    const directions = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
    return directions[Math.round(degrees / 45) % 8];
  };

  return (
    <section id="weather" className="weather">
      <h2>Thời tiết</h2>
      
      <div className="weather-tabs">
        <button 
          className={`weather-tab ${activeTab === "current" ? "active" : ""}`}
          onClick={() => setActiveTab("current")}
        >
          Hiện tại
        </button>
        <button 
          className={`weather-tab ${activeTab === "forecast" ? "active" : ""}`}
          onClick={() => setActiveTab("forecast")}
        >
          Dự báo 5 ngày
        </button>
      </div>
      
      {activeTab === "current" ? (
        weatherError ? (
          <div className="weather-error">{weatherError}</div>
        ) : !weatherData ? (
          <div className="weather-loading">Đang tải dữ liệu thời tiết...</div>
        ) : (
          <div className="current-weather">
            <div className="weather-header">
              <div className="weather-main">
                <img 
                  src={getWeatherIcon(weatherData.weather[0].icon)} 
                  alt={weatherData.weather[0].description}
                  className="weather-icon"
                />
                <div className="weather-temp">
                  <h3>{Math.round(weatherData.main.temp)}°C</h3>
                  <p className="weather-desc">{weatherData.weather[0].description}</p>
                </div>
              </div>
              <div className="weather-location">
                <p className="weather-date">{formatDate(weatherData.dt)}</p>
                <h4>{weatherData.name}</h4>
              </div>
            </div>
            
            <div className="weather-details">
              <div className="weather-detail">
                <span className="detail-label">Cảm giác như</span>
                <span className="detail-value">{Math.round(weatherData.main.feels_like)}°C</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Độ ẩm</span>
                <span className="detail-value">{weatherData.main.humidity}%</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Áp suất</span>
                <span className="detail-value">{weatherData.main.pressure} hPa</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Tầm nhìn</span>
                <span className="detail-value">{(weatherData.visibility / 1000).toFixed(1)} km</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Gió</span>
                <span className="detail-value">
                  {Math.round(weatherData.wind.speed * 3.6)} km/h {getWindDirection(weatherData.wind.deg)}
                </span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Mây</span>
                <span className="detail-value">{weatherData.clouds?.all}%</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Mặt trời mọc</span>
                <span className="detail-value">{formatTime(weatherData.sys.sunrise)}</span>
              </div>
              
              <div className="weather-detail">
                <span className="detail-label">Mặt trời lặn</span>
                <span className="detail-value">{formatTime(weatherData.sys.sunset)}</span>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="weather-forecast">
          {loading ? (
            <div className="weather-loading">Đang tải dữ liệu dự báo...</div>
          ) : error ? (
            <div className="weather-error">{error}</div>
          ) : !forecast ? (
            <div className="weather-error">Không có dữ liệu dự báo thời tiết</div>
          ) : (
            <div className="forecast-container">
              {Object.entries(forecast).slice(0, 5).map(([date, items]) => (
                <div key={date} className="forecast-day">
                  <h3 className="forecast-date">
                    {new Date(date).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "numeric",
                      month: "numeric",
                    })}
                  </h3>
                  
                  <div className="forecast-temps">
                    <span className="temp-max">
                      {Math.round(Math.max(...items.map((item) => item.main.temp_max)))}°
                    </span>
                    <span className="temp-min">
                      {Math.round(Math.min(...items.map((item) => item.main.temp_min)))}°
                    </span>
                  </div>
                  
                  <img 
                    src={getWeatherIcon(items[Math.floor(items.length / 2)].weather[0].icon)}
                    alt="Weather icon"
                    className="forecast-icon"
                  />
                  
                  <p className="forecast-desc">
                    {items[Math.floor(items.length / 2)].weather[0].description}
                  </p>
                  
                  <div className="forecast-details">
                    <div className="forecast-detail">
                      <span className="detail-icon">💧</span>
                      <span className="detail-value">
                        {Math.round(
                          items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length
                        )}%
                      </span>
                    </div>
                    
                    <div className="forecast-detail">
                      <span className="detail-icon">💨</span>
                      <span className="detail-value">
                        {Math.round(
                          items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length * 3.6
                        )} km/h
                      </span>
                    </div>
                  </div>
                  
                  <details className="forecast-hourly">
                    <summary>Chi tiết theo giờ</summary>
                    <div className="hourly-items">
                      {items.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="hourly-item">
                          <span className="hourly-time">{formatTime(item.dt)}</span>
                          <span className="hourly-temp">{Math.round(item.main.temp)}°C</span>
                          <img 
                            src={getWeatherIcon(item.weather[0].icon)} 
                            alt={item.weather[0].description}
                            className="hourly-icon"
                          />
                          <span className="hourly-desc">{item.weather[0].description}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="weather-tips">
        <h3>Lời khuyên khi đi du lịch</h3>
        <ul>
          {weatherData?.main.temp > 30 && (
            <li>Nhiệt độ cao, hãy mang theo nước uống và kem chống nắng.</li>
          )}
          {weatherData?.main.temp < 18 && (
            <li>Thời tiết khá lạnh, nên mang theo áo ấm.</li>
          )}
          {weatherData?.weather[0].main === "Rain" && (
            <li>Có mưa, hãy mang theo ô hoặc áo mưa.</li>
          )}
          {weatherData?.wind.speed * 3.6 > 20 && (
            <li>Gió khá mạnh, nên cẩn thận khi tham quan khu vực ngoài trời.</li>
          )}
        </ul>
      </div>
      
    </section>
  );
};

WeatherSection.propTypes = {
  weatherData: PropTypes.object,
  weatherError: PropTypes.string,
  location: PropTypes.shape({
    coordinates: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number
    })
  })
};

export default WeatherSection;