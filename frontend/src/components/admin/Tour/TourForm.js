import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../../styles/itineraryCSS/TourForm.css";

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

const TourForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSubmitting,
  selectedTour = null,
}) => {
  const [availableLocations, setAvailableLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [tourImage, setTourImage] = useState(null);

  // Fetch danh sách địa điểm khi component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Hiển thị preview ảnh hiện tại nếu đang edit
  useEffect(() => {
    if (
      formData.image &&
      typeof formData.image === "string" &&
      formData.image.startsWith("/")
    ) {
      setImagePreview(`http://localhost:5000${formData.image}`);
    } else if (formData.image && typeof formData.image === "string") {
      setImagePreview(formData.image);
    } else if (formData.imagePreview) {
      setImagePreview(formData.imagePreview);
    }
  }, [formData.image, formData.imagePreview]);

  // Tính toán thời gian tour
  const updateScheduleBasedOnDates = useCallback(
    (startDate, endDate, diffDays) => {
      // Tạo schedule mới với số ngày tương ứng
      const newSchedule = [];

      for (let i = 0; i < diffDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        let title = "";
        let defaultActivities = [];

        // Tạo các hoạt động mặc định tùy theo ngày đầu, cuối hoặc giữa
        if (i === 0) {
          title = "KHỞI HÀNH";
          defaultActivities = [
            "07:00: Khởi hành từ điểm hẹn",
            "12:00: Dùng bữa trưa tại nhà hàng địa phương",
            "15:00: Đến khách sạn, nhận phòng và nghỉ ngơi",
            "18:30: Dùng bữa tối và tự do khám phá thành phố",
          ];
        } else if (i === diffDays - 1) {
          title = "KẾT THÚC HÀNH TRÌNH";
          defaultActivities = [
            "07:00: Dùng điểm tâm tại khách sạn",
            "09:00: Trả phòng và mua sắm đặc sản",
            "13:00: Khởi hành về TP.HCM",
            "21:00: Về đến TP.HCM, kết thúc chương trình tour",
          ];
        } else {
          title = "GÀNH ĐÁ ĐĨA - BÃI XẾP";
          defaultActivities = [
            "06:00: Dùng bữa sáng tại khách sạn",
            "07:30: Khởi hành đi Gành Đá Đĩa - thắng cảnh địa chất nổi tiếng",
            "11:30: Dùng bữa trưa tại nhà hàng địa phương",
            "14:00: Tham quan, tắm biển tại Bãi Xếp",
            "17:00: Trở về khách sạn nghỉ ngơi",
            "18:30: Dùng bữa tối với hải sản địa phương",
          ];
        }

        newSchedule.push({
          day: `Ngày ${i + 1}`,
          date: currentDate.toISOString().split("T")[0],
          title: title,
          activities: defaultActivities,
          locations: [],
        });
      }

      setFormData((prev) => ({
        ...prev,
        schedule: newSchedule,
      }));
    },
    [setFormData]
  );

  // Tính toán thời gian khi ngày đi hoặc ngày về thay đổi
  useEffect(() => {
    if (formData.departure_date && formData.return_date) {
      const startDate = new Date(formData.departure_date);
      const endDate = new Date(formData.return_date);

      // Kiểm tra ngày hợp lệ
      if (endDate >= startDate) {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Cập nhật duration
        const durationText = `${diffDays} ngày ${diffDays - 1} đêm`;
        setFormData((prev) => ({
          ...prev,
          duration: durationText,
        }));

        // Nếu chưa có lịch trình hoặc người dùng chọn để tự động cập nhật lịch trình
        if (
          !formData.schedule ||
          formData.schedule.length === 0 ||
          formData.auto_update_schedule
        ) {
          updateScheduleBasedOnDates(startDate, endDate, diffDays);
        }
      }
    }
  }, [
    formData.departure_date,
    formData.return_date,
    formData.schedule,
    formData.auto_update_schedule,
    updateScheduleBasedOnDates,
    setFormData,
  ]);

  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const response = await axios.get("http://localhost:5000/api/locations");
      if (response.data) {
        setAvailableLocations(response.data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, WEBP.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước file quá lớn. Tối đa 5MB.");
        return;
      }

      setTourImage(file);

      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);

      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: previewURL,
        hasNewImage: true, // Flag để biết có ảnh mới
      }));
    }
  };

  const handleArrayChange = (arrayName, index, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = value;
    setFormData((prev) => ({
      ...prev,
      [arrayName]: newArray,
    }));
  };

  const handleAddArrayItem = (arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""],
    }));
  };

  const handleRemoveArrayItem = (arrayName, index) => {
    if (formData[arrayName].length <= 1) return;
    const newArray = [...formData[arrayName]];
    newArray.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      [arrayName]: newArray,
    }));
  };

  const handleScheduleChange = (scheduleIndex, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[scheduleIndex] = {
      ...newSchedule[scheduleIndex],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      schedule: newSchedule,
    }));

    // Nếu locations thay đổi, cần đồng bộ với selected_location_ids
    if (field === "locations") {
      setTimeout(() => syncLocationsToSelectedIds(), 0);
    }
  };

  const handleActivityChange = (scheduleIndex, activityIndex, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[scheduleIndex].activities[activityIndex] = value;
    setFormData((prev) => ({
      ...prev,
      schedule: newSchedule,
    }));
  };

  const handleAddActivity = (scheduleIndex) => {
    const newSchedule = [...formData.schedule];
    newSchedule[scheduleIndex].activities.push("");
    setFormData((prev) => ({
      ...prev,
      schedule: newSchedule,
    }));
  };

  const handleRemoveActivity = (scheduleIndex, activityIndex) => {
    if (formData.schedule[scheduleIndex].activities.length <= 1) return;

    const newSchedule = [...formData.schedule];
    newSchedule[scheduleIndex].activities.splice(activityIndex, 1);
    setFormData((prev) => ({
      ...prev,
      schedule: newSchedule,
    }));
  };

  const handleAddSchedule = () => {
    const newDay = formData.schedule.length + 1;
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          day: `Ngày ${newDay}`,
          title: "",
          activities: [""],
          locations: [],
        },
      ],
    }));
  };

  const handleRemoveSchedule = (scheduleIndex) => {
    if (formData.schedule.length <= 1) return;

    const newSchedule = [...formData.schedule];
    newSchedule.splice(scheduleIndex, 1);

    // Renumber days
    const updatedSchedule = newSchedule.map((day, idx) => ({
      ...day,
      day: `Ngày ${idx + 1}`,
    }));

    setFormData((prev) => ({
      ...prev,
      schedule: updatedSchedule,
    }));
  };

  // Function to update locations in each schedule day based on selected location IDs
  const updateLocationsInSchedule = (locationIds) => {
    if (!formData.schedule || formData.schedule.length === 0) return;

    // Đảm bảo tất cả location ids là số
    const normalizedLocationIds = locationIds.map((id) =>
      typeof id === "string" ? parseInt(id, 10) : id
    );

    const diffDays = formData.schedule.length;
    const locationsPerDay = Math.ceil(normalizedLocationIds.length / diffDays);

    const updatedSchedule = formData.schedule.map((day, index) => {
      const startIdx = index * locationsPerDay;
      const endIdx = Math.min(
        startIdx + locationsPerDay,
        normalizedLocationIds.length
      );
      const dayLocations = normalizedLocationIds.slice(startIdx, endIdx);

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

  const handleDestinationsSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedLocationIds = selectedOptions.map((option) => option.value);

    // Lấy thông tin các location được chọn
    const selectedLocations = availableLocations.filter((loc) =>
      selectedLocationIds.includes(loc.id.toString())
    );

    if (selectedLocations.length > 0) {
      // Tạo chuỗi tên điểm đến
      const destinationNames = selectedLocations
        .map((loc) => loc.title || loc.name)
        .join(" | ");

      // Chuyển đổi location ids thành số
      const locationIdsAsNumbers = selectedLocationIds.map((id) =>
        parseInt(id, 10)
      );

      setFormData((prev) => ({
        ...prev,
        destination: destinationNames,
        selected_location_ids: locationIdsAsNumbers,
        location_ids: locationIdsAsNumbers, // Đảm bảo tương thích với EditTour.js
      }));

      // Cập nhật lịch trình với các điểm đã chọn
      updateLocationsInSchedule(locationIdsAsNumbers);
    }
  };

  // Thêm hàm để đồng bộ từ location trong schedule ngược lên selected_location_ids
  const syncLocationsToSelectedIds = () => {
    // Lấy tất cả location IDs từ tất cả các ngày
    const allLocationIds = new Set();
    formData.schedule.forEach((day) => {
      if (day.locations && Array.isArray(day.locations)) {
        day.locations.forEach((locId) => {
          const numericId =
            typeof locId === "string" ? parseInt(locId, 10) : locId;
          allLocationIds.add(numericId);
        });
      }
    });

    const locationIdsArray = Array.from(allLocationIds);

    // Convert current selected_location_ids to numbers for comparison
    const currentSelectedIds = (formData.selected_location_ids || []).map(
      (id) => (typeof id === "string" ? parseInt(id, 10) : id)
    );

    if (
      JSON.stringify([...locationIdsArray].sort()) !==
      JSON.stringify([...currentSelectedIds].sort())
    ) {
      setFormData((prev) => ({
        ...prev,
        selected_location_ids: locationIdsArray,
        location_ids: locationIdsArray, // Đảm bảo tương thích với EditTour.js
      }));
    }
  };

  // Thêm hàm renderSelectedDayLocations để hiển thị vị trí được chọn cho mỗi ngày
  const renderSelectedDayLocations = (scheduleIndex) => {
    const day = formData.schedule[scheduleIndex];
    if (!day.locations || day.locations.length === 0) {
      return (
        <div className="no-locations-message">
          <small>Chưa có địa điểm nào cho ngày này</small>
        </div>
      );
    }

    return (
      <div className="selected-day-locations">
        <small>Địa điểm đã chọn:</small>
        <ul className="location-list">
          {day.locations.map((locItem, idx) => {
            // ✅ SỬA LỖI: Xử lý cả trường hợp locItem là ID hoặc là object
            const locationId = typeof locItem === 'object' && locItem !== null ? locItem.id : locItem;
            const location = availableLocations.find(
              (loc) => loc.id.toString() === locationId.toString()
            );
            return (
              <li key={idx} className="location-item">
                {location ? location.title || location.name : `ID không xác định: ${locationId}`}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Đảm bảo hàm handleFormSubmit gửi dữ liệu location_ids đúng cách

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate dữ liệu đầu vào
    if (
      !formData.destination ||
      !formData.departure_from ||
      !formData.duration
    ) {
      alert("Vui lòng điền đầy đủ thông tin cơ bản");
      return;
    }

    // Kiểm tra lịch trình
    if (!formData.schedule.every((day) => day.day && day.title)) {
      alert("Vui lòng điền đầy đủ thông tin lịch trình");
      return;
    }

    // Tạo deep copy của formData để xử lý
    const processedData = JSON.parse(JSON.stringify(formData));

    // Đảm bảo tất cả các trường mảng/đối tượng được xử lý đúng cách

    // Xử lý schedule: đảm bảo locations trong mỗi ngày là số nguyên
    processedData.schedule = (processedData.schedule || []).map((day) => ({
      ...day,
      day: day.day || "",
      title: day.title || "",
      activities: Array.isArray(day.activities)
        ? day.activities.filter((a) => a && a.trim() !== "")
        : [],
      locations: Array.isArray(day.locations)
        ? day.locations.map((locId) => parseInt(locId, 10))
        : [],
    }));

    // Đảm bảo selected_location_ids là mảng số nguyên
    processedData.selected_location_ids = Array.isArray(
      processedData.selected_location_ids
    )
      ? processedData.selected_location_ids.map((id) => parseInt(id, 10))
      : [];

    // Đảm bảo location_ids cũng được gửi trong dữ liệu (phục vụ tour_locations)
    processedData.location_ids = processedData.selected_location_ids;

    // Lọc và làm sạch các mảng khác
    processedData.highlights = Array.isArray(processedData.highlights)
      ? processedData.highlights.filter((h) => h && h.trim() !== "")
      : [];

    processedData.includes = Array.isArray(processedData.includes)
      ? processedData.includes.filter((i) => i && i.trim() !== "")
      : [];

    processedData.excludes = Array.isArray(processedData.excludes)
      ? processedData.excludes.filter((e) => e && e.trim() !== "")
      : [];

    processedData.notes = Array.isArray(processedData.notes)
      ? processedData.notes.filter((n) => n && n.trim() !== "")
      : [];

    // Image handling: đảm bảo giữ nguyên dữ liệu file ảnh nếu có
    if (processedData.hasNewImage && tourImage) {
      processedData.image = tourImage;
    } else {
      // Xóa image khỏi data để không update
      delete processedData.image;
    }

    console.log("Processed tour data:", processedData);

    // Gửi dữ liệu lên component cha
    onSubmit(processedData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="tour-form">
      {/* Basic Information */}
      <div className="tour-form-section">
        <h3>Thông tin cơ bản</h3>

        {isLoadingLocations ? (
          <div className="loading-locations">
            Đang tải danh sách địa điểm...
          </div>
        ) : (
          <div className="tour-form-group">
            <label>Chọn điểm đến:</label>
            <select
              multiple
              className="tour-select-locations"
              onChange={handleDestinationsSelect}
              value={(formData.selected_location_ids || []).map(id => String(id))}
              required={!selectedTour}
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
        )}

        <div className="tour-form-group">
          <label>Điểm khởi hành</label>
          <select
            name="departure_from"
            value={formData.departure_from || ""}
            onChange={handleInputChange}
            required={!selectedTour}
          >
            <option value="">-- Chọn điểm khởi hành --</option>
            {provinces.sort().map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div className="tour-form-row">
          <div className="tour-form-group">
            <label>Ngày khởi hành</label>
            <input
              type="date"
              name="departure_date"
              value={formData.departure_date || ""}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              required={!selectedTour}
            />
          </div>

          <div className="tour-form-group">
            <label>Ngày kết thúc</label>
            <input
              type="date"
              name="return_date"
              value={formData.return_date || ""}
              onChange={handleInputChange}
              min={
                formData.departure_date ||
                new Date().toISOString().split("T")[0]
              }
              required={!selectedTour}
            />
          </div>
        </div>

        <div className="tour-form-group">
          <label>Thời gian</label>
          <input
            type="text"
            name="duration"
            value={formData.duration || ""}
            onChange={handleInputChange}
            placeholder="VD: 3 ngày 2 đêm"
            readOnly
            required
          />
          <small>
            Thời gian được tính tự động từ ngày khởi hành và ngày kết thúc
          </small>
        </div>

        <div className="tour-form-checkbox">
          <input
            type="checkbox"
            id="auto_update_schedule"
            name="auto_update_schedule"
            checked={formData.auto_update_schedule || false}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                auto_update_schedule: e.target.checked,
              }));

              // Nếu bật tính năng tự động cập nhật và có ngày đi/về, cập nhật lịch trình
              if (
                e.target.checked &&
                formData.departure_date &&
                formData.return_date
              ) {
                const startDate = new Date(formData.departure_date);
                const endDate = new Date(formData.return_date);
                const diffTime = endDate.getTime() - startDate.getTime();
                const diffDays =
                  Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                updateScheduleBasedOnDates(startDate, endDate, diffDays);
              }
            }}
          />
          <label htmlFor="auto_update_schedule">
            Tự động tạo lịch trình từ ngày đi và ngày về
          </label>
        </div>

        <div className="tour-form-group">
          <label>Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Mô tả chi tiết về tour"
            required
          />
        </div>

        <div className="tour-form-group">
          <label>Ảnh tour</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <small style={{ display: "block", marginTop: "8px", color: "#666" }}>
            ✨ Để trống nếu không muốn thay đổi ảnh hiện tại
          </small>

          {imagePreview && (
            <div className="image-preview">
              <p>{formData.hasNewImage ? "🆕 Ảnh mới" : "📷 Ảnh hiện tại"}</p>
              <img src={imagePreview} alt="Tour preview" />
              {formData.hasNewImage && (
                <button
                  type="button"
                  onClick={() => {
                    setTourImage(null);
                    setImagePreview(
                      selectedTour?.image
                        ? `http://localhost:5000${selectedTour.image}`
                        : null
                    );
                    setFormData((prev) => ({
                      ...prev,
                      image: null,
                      hasNewImage: false,
                    }));
                  }}
                  className="remove-image-btn"
                  style={{ marginTop: "10px" }}
                >
                  ❌ Hủy ảnh mới
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Highlights Section */}
      <div className="tour-form-section">
        <h3>Điểm nổi bật</h3>
        {formData.highlights.map((highlight, index) => (
          <div key={index} className="tour-array-input">
            <input
              type="text"
              value={highlight}
              onChange={(e) =>
                handleArrayChange("highlights", index, e.target.value)
              }
              placeholder="Điểm nổi bật của tour"
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem("highlights", index)}
              disabled={formData.highlights.length <= 1}
              className="tour-remove-button"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleAddArrayItem("highlights")}
          className="tour-add-button"
        >
          <i className="bi bi-plus"></i> Thêm điểm nổi bật
        </button>
      </div>

      {/* Schedule Section */}
      <div className="tour-form-section">
        <h3>Lịch trình</h3>
        {formData.schedule.map((day, scheduleIndex) => (
          <div key={scheduleIndex} className="tour-schedule-item">
            <div className="schedule-header">
              <h4>{day.day}</h4>
              <button
                type="button"
                onClick={() => handleRemoveSchedule(scheduleIndex)}
                disabled={formData.schedule.length <= 1}
                className="tour-remove-button"
              >
                <i className="bi bi-trash"></i> Xóa ngày
              </button>
            </div>

            <div className="tour-form-group">
              <label>Ngày</label>
              <input
                type="text"
                value={day.day}
                onChange={(e) =>
                  handleScheduleChange(scheduleIndex, "day", e.target.value)
                }
                placeholder="Ngày thứ mấy (VD: Ngày 1)"
              />
            </div>

            <div className="tour-form-group">
              <label>Tiêu đề</label>
              <input
                type="text"
                value={day.title}
                onChange={(e) =>
                  handleScheduleChange(scheduleIndex, "title", e.target.value)
                }
                placeholder="VD: KHÁM PHÁ TUY HÒA"
              />
            </div>

            <div className="tour-form-group">
              <label>Địa điểm cho ngày này</label>
              <select
                multiple
                className="day-select-locations"
                value={day.locations || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions);
                  const locationIds = selectedOptions.map(
                    (option) => option.value
                  );
                  handleScheduleChange(scheduleIndex, "locations", locationIds);
                }}
                size={Math.min(4, availableLocations.length)}
              >
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.title || loc.name}
                  </option>
                ))}
              </select>
              <small>Giữ phím Ctrl để chọn nhiều địa điểm cho ngày này</small>
              {renderSelectedDayLocations(scheduleIndex)}
            </div>

            <div className="tour-form-group">
              <label>Hoạt động</label>
              {day.activities.map((activity, activityIndex) => (
                <div key={activityIndex} className="tour-array-input">
                  <input
                    type="text"
                    value={activity}
                    onChange={(e) =>
                      handleActivityChange(
                        scheduleIndex,
                        activityIndex,
                        e.target.value
                      )
                    }
                    placeholder="Mô tả hoạt động (VD: 08:00 - Check-in khách sạn)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveActivity(scheduleIndex, activityIndex)
                    }
                    disabled={day.activities.length <= 1}
                    className="tour-remove-button"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddActivity(scheduleIndex)}
                className="tour-add-button"
              >
                <i className="bi bi-plus"></i> Thêm hoạt động
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddSchedule}
          className="tour-add-button"
        >
          <i className="bi bi-plus"></i> Thêm ngày
        </button>
      </div>

      {/* Includes/Excludes/Notes Sections */}
      <div className="tour-form-section">
        <h3>Giá tour bao gồm</h3>
        {(formData.includes || []).map((item, index) => (
          <div key={index} className="tour-array-input">
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleArrayChange("includes", index, e.target.value)
              }
              placeholder="VD: Vé máy bay khứ hồi"
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem("includes", index)}
              disabled={(formData.includes || []).length <= 1}
              className="tour-remove-button"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!formData.includes) {
              setFormData((prev) => ({ ...prev, includes: [""] }));
            } else {
              handleAddArrayItem("includes");
            }
          }}
          className="tour-add-button"
        >
          <i className="bi bi-plus"></i> Thêm dịch vụ bao gồm
        </button>
      </div>

      <div className="tour-form-section">
        <h3>Giá tour không bao gồm</h3>
        {(formData.excludes || []).map((item, index) => (
          <div key={index} className="tour-array-input">
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleArrayChange("excludes", index, e.target.value)
              }
              placeholder="VD: Chi phí cá nhân"
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem("excludes", index)}
              disabled={(formData.excludes || []).length <= 1}
              className="tour-remove-button"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!formData.excludes) {
              setFormData((prev) => ({ ...prev, excludes: [""] }));
            } else {
              handleAddArrayItem("excludes");
            }
          }}
          className="tour-add-button"
        >
          <i className="bi bi-plus"></i> Thêm dịch vụ không bao gồm
        </button>
      </div>

      <div className="tour-form-section">
        <h3>Lưu ý cho khách hàng</h3>
        {(formData.notes || []).map((item, index) => (
          <div key={index} className="tour-array-input">
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleArrayChange("notes", index, e.target.value)
              }
              placeholder="VD: Nhớ mang theo giấy tờ tùy thân"
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem("notes", index)}
              disabled={(formData.notes || []).length <= 1}
              className="tour-remove-button"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!formData.notes) {
              setFormData((prev) => ({ ...prev, notes: [""] }));
            } else {
              handleAddArrayItem("notes");
            }
          }}
          className="tour-add-button"
        >
          <i className="bi bi-plus"></i> Thêm lưu ý
        </button>
      </div>

      {/* Action Buttons */}
      <div className="tour-form-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="tour-cancel-button"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="tour-submit-button"
        >
          {isSubmitting ? "Đang xử lý..." : "Lưu"}
        </button>
      </div>
    </form>
  );
};

export default TourForm;
