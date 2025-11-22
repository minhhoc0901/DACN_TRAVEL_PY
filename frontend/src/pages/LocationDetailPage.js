import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; 
import axios from "axios";
import "../styles/LocationCSS/LocationDetailPage.css";
// Import all components
import WeatherSection from "../components/LocationDetail/WeatherSection";
import MapSection from "../components/LocationDetail/MapSection";
import IntroSection from "../components/LocationDetail/IntroSection";
import HighlightSection from "../components/LocationDetail/HighlightSection";
import TimingSection from "../components/LocationDetail/TimingSection";
import TravelSection from "../components/LocationDetail/TravelSection";
import GallerySection from "../components/LocationDetail/GallerySection";
import FoodSection from "../components/LocationDetail/FoodSection";
import TipsSection from "../components/LocationDetail/TipsSection";
// import PhotoUploadSection from "../components/LocationDetail/PhotoUploadSection";
import Sidebar from "../components/LocationDetail/Sidebar";
import CommentSection from '../components/LocationDetail/CommentSection';

const LocationDetailPage = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null); // State để lưu dữ liệu từ API
  const [loading, setLoading] = useState(true); // State để xử lý trạng thái loading
  const [error, setError] = useState(null); // State để xử lý lỗi

  // // State for photo upload
  // const [images, setImages] = useState([]);
  // const maxNumber = 5;

  // State for weather
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // State for map
  const [viewport, setViewport] = useState({
    latitude: 13.5,
    longitude: 109.3,
    zoom: 10,
    width: "100%",
    height: "400px",
  });

  // Use environment variables for API keys
  const OPENWEATHER_API_KEY =
    process.env.REACT_APP_OPENWEATHER_API_KEY || "095cde61e730fd9406235de1237e97c1";

  // Fetch location data from API
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/locations/${id}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        setLocation(response.data);
        setLoading(false);
      } catch (err) {
        setError("Không thể lấy dữ liệu địa điểm: " + err.message);
        setLoading(false);
        console.error("Chi tiết lỗi:", err);
      }
    };

    fetchLocation();
  }, [id]);

  // Fetch weather data when location data is available
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (location && location.coordinates) {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${location.coordinates.latitude}&lon=${location.coordinates.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
          );
          setWeatherData(response.data);
          setWeatherError(null);
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setWeatherError("Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.");
        setWeatherData(null);
      }
    };
    fetchWeather();
  }, [location, OPENWEATHER_API_KEY]);

  // Update viewport when location data is available
  useEffect(() => {
    if (location && location.coordinates) {
      console.log("Updating viewport with coordinates:", location.coordinates);
      setViewport((prev) => ({
        ...prev,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        zoom: 12,
      }));
    }
  }, [location]);

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle loading, error, and not found states
  if (loading) return <div className="location-detail-page container mx-auto p-4"><p>Đang tải dữ liệu...</p></div>;
  if (error) return <div className="location-detail-page container mx-auto p-4"><p>Lỗi: {error}</p></div>;
  if (!location) return <div className="location-detail-page container mx-auto p-4"><p>Không tìm thấy địa điểm!</p></div>;

  // Function to construct image URL (if using express.static or S3/Cloudinary)
  const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") {
      return "https://via.placeholder.com/300x200?text=No+Image";
    }
    return `http://localhost:5000${imagePath}`;
  };

  return (
    <div className="location-detail-page container mx-auto p-4">
      <div className="main-location-content flex flex-col md:flex-row gap-8">
        <div className="content-left flex-1">
         
          <h1 className="text-3xl font-bold mb-2">{location.title}</h1>
          <p className="text-lg text-gray-600 mb-4">{location.subtitle || "Không có phụ đề"}</p>

          {/* Intro Section */}
          <IntroSection
            location={{
              introduction: {
                text: location.introduction?.text,
                image: location.introduction?.image,
              },
            }}
            imageMapper={(image) => getImageUrl(image)} 
          />

          {/* Highlight Section */}
          <HighlightSection
            location={{
              whyVisit: {
                architecture: {
                  title: location.whyVisit?.architecture?.title,
                  text: location.whyVisit?.architecture?.text,
                  image: location.whyVisit?.architecture?.image,
                },
                culture: location.whyVisit?.culture,
              },
            }}
            imageMapper={(image) => getImageUrl(image)}
          />

          {/* Timing Section */}
          <TimingSection
            location={{
              bestTime: location.bestTimes || [], // API trả về bestTimes thay vì bestTime
            }}
          />

          {/* Weather Section */}
          <WeatherSection 
            weatherData={weatherData} 
            weatherError={weatherError}
            location={location} // Truyền location để lấy thông tin thời tiết
             />

          {/* Travel Section */}
          <TravelSection
            location={{
              travel: {
                fromTuyHoa: location.travelMethods?.fromTuyHoa || [],
                fromElsewhere: location.travelMethods?.fromElsewhere || [],
                ticketPrice: location.travelInfo?.ticketPrice,
                tip: location.travelInfo?.tip,
              },
            }}
          />

          {/* Map Section */}
          {location.coordinates ? (
            <MapSection viewport={viewport} setViewport={setViewport} />
          ) : (
            <div>Không có dữ liệu bản đồ cho địa điểm này.</div>
          )}

          {/* Gallery Section */}
          <GallerySection
            location={{
              experiences: location.experiences || [],
            }}
            // imageMapper={(image) => getImageUrl(image)}
            imageMapper={getImageUrl}

          />

          {/* Food Section */}
          <FoodSection
            location={{
              cuisine: location.cuisine || [],
            }}
            // imageMapper={(image) => getImageUrl(image)}
            imageMapper={getImageUrl}
          />

          {/* Tips Section */}
          <TipsSection
            location={{
              tips: location.tips || [],
            }}
          />

          {/* ✅ THÊM COMMENT SECTION */}
          <CommentSection locationId={id} />

          {/* Thêm nút quay lại danh sách */}
          <Link to="/locations" className="text-blue-500 hover:underline mb-4 inline-block">
            Quay lại danh sách
          </Link>
          {/* Photo Upload Section
          <PhotoUploadSection
            images={images}
            setImages={setImages}
            maxNumber={maxNumber}
            locationId={id} // Truyền locationId để upload ảnh
          /> */}
        </div>

        {/* Sidebar */}
        <Sidebar
          location={{
            nearby: location.nearby || [],
            nearbyHotels: location.nearbyHotels || [],
          }}
          scrollToSection={scrollToSection}
        />
      </div>
    </div>
  );
};

export default LocationDetailPage;