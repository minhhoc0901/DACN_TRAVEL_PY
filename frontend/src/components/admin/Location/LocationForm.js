import React, { useState, useEffect } from "react";
import axios from "axios";

const LocationForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  selectedLocation = null,
}) => {
  const [availableLocations, setAvailableLocations] = useState([]);
  const [previewImages, setPreviewImages] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available locations for nearby selection
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/locations");
        setAvailableLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Initialize preview images from existing data if editing
  useEffect(() => {
    if (selectedLocation) {
      const newPreviews = {};

      // Set introduction image preview
      if (selectedLocation.introduction?.image) {
        newPreviews.introduction = selectedLocation.introduction.image;
      }

      // Set architecture image preview
      if (selectedLocation.whyVisit?.architecture?.image) {
        newPreviews.architecture = selectedLocation.whyVisit.architecture.image;
      }

      // Set previews for experiences
      if (selectedLocation.experiences && Array.isArray(selectedLocation.experiences)) {
        selectedLocation.experiences.forEach((exp, index) => {
          if (exp.image) {
            newPreviews[`experience_${index}`] = exp.image;
          }
        });
      }

      // Set previews for cuisines
      if (selectedLocation.cuisine && Array.isArray(selectedLocation.cuisine)) {
        selectedLocation.cuisine.forEach((cuisine, index) => {
          if (cuisine.image) {
            newPreviews[`cuisine_${index}`] = cuisine.image;
          }
        });
      }

      setPreviewImages(newPreviews);
    }
  }, [selectedLocation]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle array field changes (like bestTimes, tips)
  const handleArrayChange = (name, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].map((item, i) => (i === index ? value : item)),
    }));
  };

  // Add a new item to an array field
  const handleAddArrayItem = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: [...prev[name], ""],
    }));
  };

  // Remove an item from an array field
  const handleRemoveArrayItem = (name, index) => {
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index),
    }));
    
    // Also remove preview image if exists for experiences or cuisines
    if (name === 'experiences' || name === 'cuisines') {
      const type = name === 'experiences' ? 'experience' : 'cuisine';
      setPreviewImages((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[`${type}_${index}`];
        return newPreviews;
      });
    }
  };

  // Handle travel method changes
  const handleTravelMethodChange = (type, index, value) => {
    setFormData((prev) => {
      // Ensure travelMethods and its properties exist
      const travelMethods = prev.travelMethods || {};
      const methods = travelMethods[type] || [];

      // Create a new array with the updated value
      const updatedMethods = [...methods];
      updatedMethods[index] = value;

      return {
        ...prev,
        travelMethods: {
          ...travelMethods,
          [type]: updatedMethods,
        },
      };
    });
  };

  // Add a new travel method
  const handleAddTravelMethod = (type) => {
    setFormData((prev) => ({
      ...prev,
      travelMethods: {
        ...prev.travelMethods,
        [type]: [...prev.travelMethods[type], ""],
      },
    }));
  };

  // Remove a travel method
  const handleRemoveTravelMethod = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      travelMethods: {
        ...prev.travelMethods,
        [type]: prev.travelMethods[type].filter((_, i) => i !== index),
      },
    }));
  };

  // Handle experience text changes
  const handleExperienceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  // Add a new experience
  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [...prev.experiences, { text: "", image: null }],
    }));
  };

  // Remove an experience
  const handleRemoveExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));

    // Also remove preview image if exists
    setPreviewImages((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[`experience_${index}`];
      return newPreviews;
    });
  };

  // Handle cuisine text changes
  const handleCuisineChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.map((cuisine, i) =>
        i === index ? { ...cuisine, [field]: value } : cuisine
      ),
    }));
  };

  // Add a new cuisine
  const handleAddCuisine = () => {
    setFormData((prev) => ({
      ...prev,
      cuisines: [...prev.cuisines, { text: "", image: null }],
    }));
  };

  // Remove a cuisine
  const handleRemoveCuisine = (index) => {
    setFormData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.filter((_, i) => i !== index),
    }));

    // Also remove preview image if exists
    setPreviewImages((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[`cuisine_${index}`];
      return newPreviews;
    });
  };

  // Handle main image changes (introduction, architecture)
  const handleImageChange = (type, file) => {
    if (file) {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setPreviewImages((prev) => ({
        ...prev,
        [type]: previewUrl,
      }));

      // Update the form data
      setFormData((prev) => ({
        ...prev,
        images: {
          ...prev.images,
          [type]: file,
        },
      }));
    }
  };

  // Handle experience/cuisine image changes
  const handleDetailImageChange = (type, index, file) => {
    if (file) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImages((prev) => ({
        ...prev,
        [`${type}_${index}`]: previewUrl,
      }));

      // Update the corresponding form data
      if (type === "experience") {
        handleExperienceChange(index, "image", file);
      } else if (type === "cuisine") {
        handleCuisineChange(index, "image", file);
      }
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const locationFormData = new FormData();

    // Add basic fields
    locationFormData.append('name', formData.name);
    locationFormData.append('type', formData.type); 
    locationFormData.append('description', formData.description);
    locationFormData.append('latitude', formData.latitude);
    locationFormData.append('longitude', formData.longitude);
    locationFormData.append('subtitle', formData.subtitle);
    locationFormData.append('introduction', formData.introduction);
    locationFormData.append('why_visit_architecture_title', formData.why_visit_architecture_title);
    locationFormData.append('why_visit_architecture_text', formData.why_visit_architecture_text);
    locationFormData.append('why_visit_culture', formData.why_visit_culture);
    locationFormData.append('ticket_price', formData.ticket_price);
    locationFormData.append('tip', formData.tip);

    // Process arrays and objects - filter out empty values
    locationFormData.append('bestTimes', JSON.stringify(
      formData.bestTimes.filter(time => time.trim())
    ));

    locationFormData.append('travelMethods', JSON.stringify({
      fromTuyHoa: formData.travelMethods.fromTuyHoa.filter(m => m.trim()),
      fromElsewhere: formData.travelMethods.fromElsewhere.filter(m => m.trim())
    }));

    // Process experiences with their existing images
    locationFormData.append('experiences', JSON.stringify(
      formData.experiences
        .filter(exp => exp.text.trim())
        .map(exp => ({
          text: exp.text.trim(),
          imageUrl: exp.imageUrl // Keep reference to existing image
        }))
    ));

    // Process cuisines with their existing images
    locationFormData.append('cuisines', JSON.stringify(
      formData.cuisines
        .filter(cuisine => cuisine.text.trim())
        .map(cuisine => ({
          text: cuisine.text.trim(),
          imageUrl: cuisine.imageUrl // Keep reference to existing image
        }))
    ));

    locationFormData.append('tips', JSON.stringify(
      formData.tips.filter(tip => tip.trim())
    ));

    locationFormData.append('nearby', JSON.stringify(
      formData.nearby.filter(id => id)
    ));

    // Handle file uploads
    if (formData.images.introduction instanceof File) {
      locationFormData.append('introductionImage', formData.images.introduction);
    }
    
    if (formData.images.architecture instanceof File) {
      locationFormData.append('architectureImage', formData.images.architecture);
    }

    // Handle experience images
    formData.experiences.forEach((exp, index) => {
      if (exp.image instanceof File) {
        locationFormData.append(`experienceImage_${index}`, exp.image);
      }
    });

    // Handle cuisine images
    formData.cuisines.forEach((cuisine, index) => {
      if (cuisine.image instanceof File) {
        locationFormData.append(`cuisineImage_${index}`, cuisine.image);
      }
    });

    // Submit the form
    onSubmit(e, locationFormData)
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  

  // Return the JSX
  return (
    <div className="modal-scroll">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="section-title-manager">Thông tin cơ bản</h3>
          <div className="form-group">
            <label className="form-label">Tên địa điểm</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Loại địa điểm</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Chọn loại địa điểm</option>
              <option value="Thiên nhiên">Thiên nhiên</option>
              <option value="Bãi biển">Bãi biển</option>
              <option value="Văn hóa">Văn hóa</option>
              <option value="Di tích lịch sử">Di tích lịch sử</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả ngắn</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tọa độ</label>
            <div className="coordinates-inputs">
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Vĩ độ"
                step="any"
                required
              />
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Kinh độ"
                step="any"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phụ đề</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Giới thiệu</h3>
          <div className="form-group">
            <label className="form-label">Giới thiệu</label>
            <textarea
              name="introduction"
              value={formData.introduction}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ảnh giới thiệu</label>
            {previewImages.introduction && (
              <div className="current-image">
                <img
                  src={
                    previewImages.introduction.startsWith("blob:")
                      ? previewImages.introduction
                      : `http://localhost:5000${previewImages.introduction}`
                  }
                  alt="Ảnh giới thiệu"
                  className="preview-image"
                  style={{ maxWidth: "200px", marginBottom: "10px" }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageChange("introduction", e.target.files[0])
              }
              className="form-input"
            />
            {selectedLocation && (
              <small>Để trống nếu không muốn thay đổi ảnh</small>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Lý do nên đến</h3>
          <div className="form-group">
            <label className="form-label">Kiến trúc - Tiêu đề</label>
            <input
              type="text"
              name="why_visit_architecture_title"
              value={formData.why_visit_architecture_title}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kiến trúc - Mô tả</label>
            <textarea
              name="why_visit_architecture_text"
              value={formData.why_visit_architecture_text}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ảnh kiến trúc</label>
            {previewImages.architecture && (
              <div className="current-image">
                <img
                  src={
                    previewImages.architecture.startsWith("blob:")
                      ? previewImages.architecture
                      : `http://localhost:5000${previewImages.architecture}`
                  }
                  alt="Ảnh kiến trúc"
                  className="preview-image"
                  style={{ maxWidth: "200px", marginBottom: "10px" }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleImageChange("architecture", e.target.files[0])
              }
              className="form-input"
            />
            {selectedLocation && (
              <small>Để trống nếu không muốn thay đổi ảnh</small>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Văn hóa</label>
            <textarea
              name="why_visit_culture"
              value={formData.why_visit_culture}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Thông tin du lịch</h3>
          <div className="form-group">
            <label className="form-label">Giá vé tham quan</label>
            <input
              type="text"
              name="ticket_price"
              value={formData.ticket_price}
              onChange={handleInputChange}
              className="form-input"
              placeholder="VD: Miễn phí hoặc 50.000 VNĐ/người"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lưu ý khi tham quan</label>
            <textarea
              name="tip"
              value={formData.tip}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Các lưu ý cho du khách khi đến tham quan"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Thời điểm tốt nhất để tham quan</h3>
          {formData.bestTimes.map((time, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={time}
                onChange={(e) =>
                  handleArrayChange("bestTimes", index, e.target.value)
                }
                className="form-input"
                placeholder="VD: Sáng sớm (5h-8h)"
              />
              <button
                type="button"
                onClick={() => handleRemoveArrayItem("bestTimes", index)}
                className="remove-button"
                disabled={formData.bestTimes.length <= 1}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem("bestTimes")}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm thời điểm
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Phương thức di chuyển</h3>
          <h4 className="subsection-title">Từ Tuy Hòa</h4>
          {Array.isArray(formData.travelMethods?.fromTuyHoa) ? (
            formData.travelMethods.fromTuyHoa.map((method, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={method}
                  onChange={(e) =>
                    handleTravelMethodChange(
                      "fromTuyHoa",
                      index,
                      e.target.value
                    )
                  }
                  className="form-input"
                  placeholder="VD: Xe máy (15 phút)"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTravelMethod("fromTuyHoa", index)}
                  className="remove-button"
                  disabled={
                    (formData.travelMethods.fromTuyHoa || []).length <= 1
                  }
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))
          ) : (
            <div className="array-input">
              <input
                type="text"
                value=""
                onChange={(e) =>
                  handleTravelMethodChange("fromTuyHoa", 0, e.target.value)
                }
                className="form-input"
                placeholder="VD: Xe máy (15 phút)"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => handleAddTravelMethod("fromTuyHoa")}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm phương thức
          </button>

          <h4 className="subsection-title">Từ nơi khác</h4>
          {Array.isArray(formData.travelMethods?.fromElsewhere) ? (
            formData.travelMethods.fromElsewhere.map((method, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={method}
                  onChange={(e) =>
                    handleTravelMethodChange(
                      "fromElsewhere",
                      index,
                      e.target.value
                    )
                  }
                  className="form-input"
                  placeholder="VD: Máy bay (1 giờ)"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveTravelMethod("fromElsewhere", index)
                  }
                  className="remove-button"
                  disabled={
                    (formData.travelMethods.fromElsewhere || []).length <= 1
                  }
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))
          ) : (
            <div className="array-input">
              <input
                type="text"
                value=""
                onChange={(e) =>
                  handleTravelMethodChange("fromElsewhere", 0, e.target.value)
                }
                className="form-input"
                placeholder="VD: Máy bay (1 giờ)"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => handleAddTravelMethod("fromElsewhere")}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm phương thức
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Trải nghiệm</h3>
          {formData.experiences.map((exp, index) => (
            <div key={index} className="detail-item">
              <div className="form-group">
                <label className="form-label">
                  Nội dung trải nghiệm {index + 1}
                </label>
                <textarea
                  value={exp.text || ''}
                  onChange={(e) =>
                    handleExperienceChange(index, "text", e.target.value)
                  }
                  className="form-input"
                  rows="2"
                  placeholder="Mô tả trải nghiệm"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Ảnh trải nghiệm {index + 1}
                </label>
                {previewImages[`experience_${index}`] && (
                  <div className="current-image">
                    <img
                      src={
                        previewImages[`experience_${index}`].startsWith("blob:")
                          ? previewImages[`experience_${index}`]
                          : `http://localhost:5000${
                              previewImages[`experience_${index}`]
                            }`
                      }
                      alt={`Trải nghiệm ${index + 1}`}
                      className="preview-image"
                      style={{ maxWidth: "200px", marginBottom: "10px" }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleDetailImageChange(
                      "experience",
                      index,
                      e.target.files[0]
                    )
                  }
                  className="form-input"
                />
                {selectedLocation && (
                  <small>Để trống nếu không muốn thay đổi ảnh</small>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveExperience(index)}
                className="remove-button detail-remove"
                disabled={formData.experiences.length <= 1}
              >
                <i className="bi bi-trash"></i> Xóa trải nghiệm
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddExperience}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm trải nghiệm
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Ẩm thực</h3>
          {formData.cuisines.map((cuisine, index) => (
            <div key={index} className="detail-item">
              <div className="form-group">
                <label className="form-label">
                  Nội dung ẩm thực {index + 1}
                </label>
                <textarea
                  value={cuisine.text || ''}
                  onChange={(e) =>
                    handleCuisineChange(index, "text", e.target.value)
                  }
                  className="form-input"
                  rows="2"
                  placeholder="Mô tả món ăn"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ảnh ẩm thực {index + 1}</label>
                {previewImages[`cuisine_${index}`] && (
                  <div className="current-image">
                    <img
                      src={
                        previewImages[`cuisine_${index}`].startsWith("blob:")
                          ? previewImages[`cuisine_${index}`]
                          : `http://localhost:5000${
                              previewImages[`cuisine_${index}`]
                            }`
                      }
                      alt={`Ẩm thực ${index + 1}`}
                      className="preview-image"
                      style={{ maxWidth: "200px", marginBottom: "10px" }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleDetailImageChange("cuisine", index, e.target.files[0])
                  }
                  className="form-input"
                />
                {selectedLocation && (
                  <small>Để trống nếu không muốn thay đổi ảnh</small>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCuisine(index)}
                className="remove-button detail-remove"
                disabled={formData.cuisines.length <= 1}
              >
                <i className="bi bi-trash"></i> Xóa ẩm thực
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCuisine}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm ẩm thực
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Lưu ý</h3>
          {formData.tips.map((tip, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={tip}
                onChange={(e) =>
                  handleArrayChange("tips", index, e.target.value)
                }
                className="form-input"
                placeholder="VD: Mang theo nước uống, kem chống nắng"
              />
              <button
                type="button"
                onClick={() => handleRemoveArrayItem("tips", index)}
                className="remove-button"
                disabled={formData.tips.length <= 1}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddArrayItem("tips")}
            className="add-button"
          >
            <i className="bi bi-plus"></i> Thêm lưu ý
          </button>
        </div>

        <div className="form-section">
          <h3 className="section-title-manager">Địa điểm lân cận</h3>
          <select
            multiple
            value={formData.nearby}
            onChange={(e) => {
              const values = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setFormData((prev) => ({
                ...prev,
                nearby: values,
              }));
            }}
            className="form-input"
          >
            {availableLocations
              .filter(
                (loc) => !selectedLocation || Number(loc.id) !== Number(selectedLocation.id)
              )
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.title || loc.name}
                </option>
              ))}
          </select>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            onClick={onCancel} 
            className="cancel-button"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : (selectedLocation ? "Lưu" : "Thêm")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationForm;