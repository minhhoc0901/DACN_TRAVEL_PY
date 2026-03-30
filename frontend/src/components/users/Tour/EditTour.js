import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getDisplayImageUrl } from "../../../utils/imageUtils";
import { CONFIG } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/user/EditTour.css";

const provinces = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "TP Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

const EditTour = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);

  // State ban đầu cho form
  const [formData, setFormData] = useState({
    destination: "",
    departure_from: "",
    departure_date: "",
    return_date: "",
    duration: "",
    description: "",
    image: null,
    imagePreview: null,
    highlights: [""],
    selected_location_ids: [],
    schedule: [
      {
        day: "1",
        title: "",
        activities: [""],
        locations: [],
      },
    ],
    includes: [""],
    excludes: [""],
    notes: [""],
  });

  // Fetch locations khi component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${CONFIG.API_API_URL}/locations`);
        setAvailableLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Fetch tour data khi component mount
  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${CONFIG.API_API_URL}/tours/${id}`
        );

        if (response.data.success) {
          const tourData = response.data.tour;
          setTour(tourData);

          // Xử lý dữ liệu locations trong schedule
          const updatedSchedule = tourData.schedule.map((day) => {
            return {
              ...day,
              locations: day.locations
                ? day.locations.map((loc) => loc.id)
                : [],
            };
          });

          // Trích xuất location IDs từ tất cả các ngày trong lịch trình
          const allLocationIds = [];
          tourData.schedule.forEach((day) => {
            if (day.locations && Array.isArray(day.locations)) {
              day.locations.forEach((loc) => {
                if (loc.id && !allLocationIds.includes(loc.id)) {
                  allLocationIds.push(loc.id);
                }
              });
            }
          });

          // Đảm bảo includes, excludes và notes có ít nhất một phần tử
          const includes =
            Array.isArray(tourData.includes) && tourData.includes.length > 0
              ? tourData.includes
              : [""];

          const excludes =
            Array.isArray(tourData.excludes) && tourData.excludes.length > 0
              ? tourData.excludes
              : [""];

          const notes =
            Array.isArray(tourData.notes) && tourData.notes.length > 0
              ? tourData.notes
              : [""];

          setFormData({
            ...tourData,
            schedule: updatedSchedule,
            image: null, // Giữ nguyên là null, chỉ cập nhật khi user tải lên file mới
            // Tạo URL preview từ ảnh hiện tại của tour
            imagePreview: getDisplayImageUrl(tourData.image),
            hasNewImage: false, // Ban đầu chưa có ảnh mới
            selected_location_ids: allLocationIds,
            includes,
            excludes,
            notes,
            departure_date: tourData.departure_date || "",
            return_date: tourData.return_date || "",
          });
        } else {
          throw new Error(
            response.data.message || "Không thể tải thông tin tour"
          );
        }
      } catch (err) {
        console.error("Error fetching tour:", err);
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  // Xử lý khi submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);

    try {
      const tourFormData = new FormData();

      // Add basic fields
      tourFormData.append("destination", formData.destination);
      tourFormData.append("departure_from", formData.departure_from);
      tourFormData.append("duration", formData.duration);
      tourFormData.append("description", formData.description);
      tourFormData.append("departure_date", formData.departure_date || "");
      tourFormData.append("return_date", formData.return_date || "");

      // QUAN TRỌNG: Chỉ append image nếu có file mới
      if (formData.hasNewImage && formData.image instanceof File) {
        tourFormData.append("image", formData.image);
        console.log("Appending new image file to FormData");
      } else {
        console.log("No new image - keeping existing image");
      }

      // Add arrays as JSON strings
      tourFormData.append(
        "highlights",
        JSON.stringify(formData.highlights.filter((h) => h.trim()))
      );
      tourFormData.append("schedule", JSON.stringify(formData.schedule));
      tourFormData.append(
        "includes",
        JSON.stringify(formData.includes.filter((i) => i.trim()))
      );
      tourFormData.append(
        "excludes",
        JSON.stringify(formData.excludes.filter((e) => e.trim()))
      );
      tourFormData.append(
        "notes",
        JSON.stringify(formData.notes.filter((n) => n.trim()))
      );
      tourFormData.append(
        "selected_location_ids",
        JSON.stringify(formData.selected_location_ids || [])
      );

      console.log("Submitting tour update with FormData");

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await axios.put(
        `${CONFIG.API_API_URL}/tours/${id}`,
        tourFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Cập nhật tour thành công");
        setTimeout(() => {
          navigate(`/user/tour-preview/${id}`);
        }, 2000);
      } else {
        throw new Error(response.data.message || "Lỗi khi cập nhật tour");
      }
    } catch (err) {
      console.error("Error updating tour:", err);
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật tour");
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý khi thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý khi thay đổi file
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, WEBP."
        );
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước file quá lớn. Tối đa 5MB.");
        return;
      }

      console.log("File selected:", file.name, file.type, file.size);

      const previewURL = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        image: file, // Lưu file object
        imagePreview: previewURL, // Lưu URL preview
        hasNewImage: true, // Flag để biết có ảnh mới
      }));

      console.log("Image preview created:", previewURL);
    }
  };

  // Add cleanup for object URLs on component unmount
  useEffect(() => {
    return () => {
      // Cleanup any created object URLs to prevent memory leaks
      if (formData.imagePreview && formData.imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  // Xử lý highlights
  const handleHighlightChange = (index, value) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData((prev) => ({
      ...prev,
      highlights: newHighlights,
    }));
  };

  const addHighlight = () => {
    setFormData((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ""],
    }));
  };

  const removeHighlight = (index) => {
    if (formData.highlights.length <= 1) return;

    const newHighlights = [...formData.highlights];
    newHighlights.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      highlights: newHighlights,
    }));
  };

  // Xử lý schedule
  const handleScheduleChange = (dayIndex, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    setFormData((prev) => ({ ...prev, schedule: newSchedule }));
  };

  const addScheduleDay = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          day: `${prev.schedule.length + 1}`,
          title: "",
          activities: [""],
          locations: [],
        },
      ],
    }));
  };

  const removeScheduleDay = (dayIndex) => {
    if (formData.schedule.length <= 1) return;

    const newSchedule = [...formData.schedule];
    newSchedule.splice(dayIndex, 1);

    // Renumber days
    const updatedSchedule = newSchedule.map((day, idx) => ({
      ...day,
      day: `${idx + 1}`,
    }));

    setFormData((prev) => ({ ...prev, schedule: updatedSchedule }));
  };

  // Xử lý activities trong lịch trình
  const handleActivityChange = (dayIndex, activityIndex, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities[activityIndex] = value;
    setFormData((prev) => ({ ...prev, schedule: newSchedule }));
  };

  const addActivity = (dayIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities.push("");
    setFormData((prev) => ({ ...prev, schedule: newSchedule }));
  };

  const removeActivity = (dayIndex, activityIndex) => {
    if (formData.schedule[dayIndex].activities.length <= 1) return;

    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].activities.splice(activityIndex, 1);
    setFormData((prev) => ({ ...prev, schedule: newSchedule }));
  };

  // Function to update locations in each schedule day based on selected location IDs
  const updateLocationsInSchedule = (locationIds) => {
    if (!formData.schedule || formData.schedule.length === 0) return;

    const diffDays = formData.schedule.length;
    const locationsPerDay = Math.ceil(locationIds.length / diffDays);

    const updatedSchedule = formData.schedule.map((day, index) => {
      const startIdx = index * locationsPerDay;
      const endIdx = Math.min(startIdx + locationsPerDay, locationIds.length);
      const dayLocations = locationIds.slice(startIdx, endIdx);

      return {
        ...day,
        locations: dayLocations,
      };
    });

    setFormData((prev) => ({
      ...prev,
      schedule: updatedSchedule,
    }));
  };

  // Handler for includes list items
  const handleIncludeChange = (index, value) => {
    const newIncludes = [...formData.includes];
    newIncludes[index] = value;
    setFormData((prev) => ({
      ...prev,
      includes: newIncludes,
    }));
  };

  const addInclude = () => {
    setFormData((prev) => ({
      ...prev,
      includes: [...prev.includes, ""],
    }));
  };

  const removeInclude = (index) => {
    if (formData.includes.length <= 1) return;

    const newIncludes = [...formData.includes];
    newIncludes.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      includes: newIncludes,
    }));
  };

  // Handler for excludes list items
  const handleExcludeChange = (index, value) => {
    const newExcludes = [...formData.excludes];
    newExcludes[index] = value;
    setFormData((prev) => ({
      ...prev,
      excludes: newExcludes,
    }));
  };

  const addExclude = () => {
    setFormData((prev) => ({
      ...prev,
      excludes: [...prev.excludes, ""],
    }));
  };

  const removeExclude = (index) => {
    if (formData.excludes.length <= 1) return;

    const newExcludes = [...formData.excludes];
    newExcludes.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      excludes: newExcludes,
    }));
  };

  // Handler for notes list items
  const handleNoteChange = (index, value) => {
    const newNotes = [...formData.notes];
    newNotes[index] = value;
    setFormData((prev) => ({
      ...prev,
      notes: newNotes,
    }));
  };

  const addNote = () => {
    setFormData((prev) => ({
      ...prev,
      notes: [...prev.notes, ""],
    }));
  };

  const removeNote = (index) => {
    if (formData.notes.length <= 1) return;

    const newNotes = [...formData.notes];
    newNotes.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      notes: newNotes,
    }));
  };

  // Xử lý khi chọn địa điểm
  const handleDestinationsSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedLocationIds = selectedOptions.map((option) => option.value);

    // Get the selected location objects
    const selectedLocations = availableLocations.filter((loc) =>
      selectedLocationIds.includes(loc.id.toString())
    );

    if (selectedLocations.length > 0) {
      // Create a combined destination string
      const destinationNames = selectedLocations
        .map((loc) => loc.title || loc.name)
        .join(" | ");

      setFormData((prev) => ({
        ...prev,
        destination: destinationNames,
        selected_location_ids: selectedLocationIds,
      }));

      // Cập nhật lịch trình với các điểm đã chọn
      if (updateLocationsInSchedule) {
        updateLocationsInSchedule(selectedLocationIds);
      }
    }
  };

  if (loading) {
    return (
      <div className="edit-tour-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="edit-tour-container">
        <div className="error-message">
          <h3>Lỗi</h3>
          <p>{error || "Không tìm thấy tour"}</p>
          <button
            onClick={() => navigate("/user/my-tours")}
            className="back-button"
          >
            Quay lại danh sách tour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-tour-container">
      <h1>Chỉnh sửa Tour</h1>
      <p className="edit-tour-note">
        Chú ý: Sau khi chỉnh sửa, tour của bạn sẽ được đưa về trạng thái "Chờ
        duyệt" và cần được quản trị viên phê duyệt lại.
      </p>

      <form onSubmit={handleSubmit} className="edit-tour-form">
        <div className="edit-tour-form-group">
          <label>Chọn điểm đến:</label>
          <select
            multiple
            className="tour-select-locations"
            onChange={handleDestinationsSelect}
            value={formData.selected_location_ids || []}
            size={Math.min(6, availableLocations.length)}
          >
            {availableLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.title || loc.name}
              </option>
            ))}
          </select>
          <small>
            Giữ phím Ctrl để chọn nhiều địa điểm du lịch từ danh sách
          </small>
        </div>

        <div className="edit-tour-form-group">
          <label htmlFor="departure_from">Điểm khởi hành</label>
          <select
            id="departure_from"
            name="departure_from"
            value={formData.departure_from}
            onChange={handleInputChange}
          >
            <option value="">-- Chọn điểm khởi hành --</option>
            {provinces.sort().map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-tour-form-group">
          <label htmlFor="departure_date">Ngày khởi hành</label>
          <input
            type="date"
            id="departure_date"
            name="departure_date"
            value={formData.departure_date}
            onChange={handleInputChange}
          />
        </div>

        <div className="edit-tour-form-group">
          <label htmlFor="return_date">Ngày kết thúc</label>
          <input
            type="date"
            id="return_date"
            name="return_date"
            value={formData.return_date}
            onChange={handleInputChange}
          />
        </div>

        <div className="edit-tour-form-group">
          <label htmlFor="duration">Thời gian</label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="VD: 3 ngày 2 đêm"
            required
          />
        </div>

        <div className="edit-tour-form-group">
          <label htmlFor="description">Mô tả</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="5"
            required
          ></textarea>
        </div>

        {/* Phần hiển thị và upload hình ảnh */}
        <div className="edit-tour-form-group">
          <label htmlFor="image">Hình ảnh</label>
          <div className="image-upload-container">
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
            />

            <small
              style={{ display: "block", marginTop: "8px", color: "#666" }}
            >
              ✨ Để trống nếu không muốn thay đổi ảnh hiện tại
            </small>

            <div className="image-input">
              {formData.imagePreview ? (
                <div className="preview-container">
                  <h4>
                    🖼️{" "}
                    {formData.hasNewImage
                      ? "Hình ảnh mới (chưa lưu)"
                      : "Hình ảnh hiện tại"}
                  </h4>
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="preview-image"
                    onLoad={() =>
                      console.log("Preview image loaded successfully")
                    }
                    onError={(e) => {
                      console.error("Failed to load preview image");
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                  {formData.hasNewImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          image: null,
                          imagePreview: getDisplayImageUrl(tour.image),
                          hasNewImage: false,
                        }));
                        document.getElementById("image").value = "";
                      }}
                      className="remove-image-btn"
                      style={{ marginTop: "10px" }}
                    >
                      ❌ Hủy ảnh mới
                    </button>
                  )}
                </div>
              ) : (
                <div className="no-image-placeholder">
                  <p>📷 Chưa có hình ảnh</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="edit-tour-form-group">
          <label>Điểm nổi bật</label>
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="edit-tour-highlight-input">
              <input
                type="text"
                value={highlight}
                onChange={(e) => handleHighlightChange(index, e.target.value)}
                placeholder={`Điểm nổi bật ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeHighlight(index)}
                className="remove-btn"
                disabled={formData.highlights.length <= 1}
              >
                Xóa
              </button>
            </div>
          ))}
          <button type="button" onClick={addHighlight} className="add-btn">
            + Thêm điểm nổi bật
          </button>
        </div>

        {/* Lịch trình */}
        <div className="edit-tour-form-section">
          <h3>Lịch trình</h3>
          {formData.schedule.map((day, dayIndex) => (
            <div key={dayIndex} className="schedule-day">
              <div className="day-header">
                <h4>Ngày {day.day}</h4>
                <button
                  type="button"
                  onClick={() => removeScheduleDay(dayIndex)}
                  className="remove-btn"
                  disabled={formData.schedule.length <= 1}
                >
                  Xóa ngày
                </button>
              </div>

              <div className="edit-tour-form-group">
                <label>Tiêu đề ngày</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) =>
                    handleScheduleChange(dayIndex, "title", e.target.value)
                  }
                  placeholder="VD: KHÁM PHÁ TUY HÒA"
                  required
                />
              </div>

              <div className="edit-tour-form-group">
                <label>Hoạt động</label>
                {day.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="activity-input">
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) =>
                        handleActivityChange(
                          dayIndex,
                          activityIndex,
                          e.target.value
                        )
                      }
                      placeholder="Mô tả hoạt động (VD: 08:00 - Check-in khách sạn)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeActivity(dayIndex, activityIndex)}
                      className="remove-btn"
                      disabled={day.activities.length <= 1}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addActivity(dayIndex)}
                  className="add-btn"
                >
                  + Thêm hoạt động
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addScheduleDay} className="add-btn">
            + Thêm ngày
          </button>
        </div>

        {/* Giá tour bao gồm section */}
        <div className="edit-tour-form-section">
          <h3>Giá tour bao gồm</h3>
          {formData.includes.map((item, index) => (
            <div key={index} className="item-input">
              <input
                type="text"
                value={item}
                onChange={(e) => handleIncludeChange(index, e.target.value)}
                placeholder="Nhập dịch vụ bao gồm (VD: Vé máy bay khứ hồi)"
                required
              />
              <button
                type="button"
                onClick={() => removeInclude(index)}
                className="remove-btn"
                disabled={formData.includes.length <= 1}
              >
                Xóa
              </button>
            </div>
          ))}
          <button type="button" onClick={addInclude} className="add-btn">
            + Thêm dịch vụ bao gồm
          </button>
        </div>

        {/* Giá tour không bao gồm section */}
        <div className="edit-tour-form-section">
          <h3>Giá tour không bao gồm</h3>
          {formData.excludes.map((item, index) => (
            <div key={index} className="item-input">
              <input
                type="text"
                value={item}
                onChange={(e) => handleExcludeChange(index, e.target.value)}
                placeholder="Nhập dịch vụ không bao gồm (VD: Chi phí cá nhân)"
                required
              />
              <button
                type="button"
                onClick={() => removeExclude(index)}
                className="remove-btn"
                disabled={formData.excludes.length <= 1}
              >
                Xóa
              </button>
            </div>
          ))}
          <button type="button" onClick={addExclude} className="add-btn">
            + Thêm dịch vụ không bao gồm
          </button>
        </div>

        {/* Lưu ý section */}
        <div className="edit-tour-form-section">
          <h3>Lưu ý</h3>
          {formData.notes.map((item, index) => (
            <div key={index} className="item-input">
              <input
                type="text"
                value={item}
                onChange={(e) => handleNoteChange(index, e.target.value)}
                placeholder="Nhập lưu ý (VD: Mang theo giấy tờ tùy thân)"
                required
              />
              <button
                type="button"
                onClick={() => removeNote(index)}
                className="remove-btn"
                disabled={formData.notes.length <= 1}
              >
                Xóa
              </button>
            </div>
          ))}
          <button type="button" onClick={addNote} className="add-btn">
            + Thêm lưu ý
          </button>
        </div>

        <div className="edit-tour-form-actions">
          <button
            type="button"
            onClick={() => navigate("/user/my-tours")}
            className="cancel-btn"
            disabled={submitting}
          >
            Hủy
          </button>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>

      <ToastContainer />
    </div>
  );
};

export default EditTour;
