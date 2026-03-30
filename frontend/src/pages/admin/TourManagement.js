import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TourList from "../../components/admin/Tour/TourList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { CONFIG } from "../../config";
import EditTourModal from "../../components/admin/Tour/EditTourModal";
import AddTourModal from "../../components/admin/Tour/AddTourModal";

import "../../styles/itineraryCSS/TourManagement.css";

const TourManagement = () => {
  const navigate = useNavigate();
  const { logout, getToken, user } = useAuth();

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // Tabs: 'all', 'pending', 'approved', 'rejected'
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTour, setCurrentTour] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingTourId, setProcessingTourId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTourFormData, setNewTourFormData] = useState({
    destination: "",
    departure_from: "",
    duration: "",
    description: "",
    image: null,
    highlights: ["", "", "", ""],
    schedule: [
      {
        day: "Ngày 1",
        title: "",
        activities: [""],
      },
    ],
  });

  const handleTokenExpired = useCallback(() => {
    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    logout();
    navigate("/login", { state: { from: "/admin/tours" } });
  }, [logout, navigate]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleTokenExpired]);

  useEffect(() => {
    const currentToken = getToken();

    if (!currentToken) {
      navigate("/login", { state: { from: "/admin/tours" } });
    }
  }, [navigate, getToken]);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const currentToken = getToken();

      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      const response = await axios.get(`${CONFIG.API_API_URL}/tours`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      console.log("API response status:", response.status);
      console.log("API response data:", response.data);

      if (response.data.success) {
        let normalizedTours = response.data.tours.map((tour) => ({
          ...tour,
          status: tour.status || "pending",
        }));

        const pending = normalizedTours.filter(
          (t) => t.status === "pending"
        ).length;
        const approved = normalizedTours.filter(
          (t) => t.status === "approved"
        ).length;
        const rejected = normalizedTours.filter(
          (t) => t.status === "rejected"
        ).length;

        console.log(
          `Đã tải dữ liệu: ${normalizedTours.length} tour (Chờ duyệt: ${pending}, Đã duyệt: ${approved}, Từ chối: ${rejected})`
        );

        setTours(normalizedTours);
      } else {
        throw new Error(
          response.data.message || "Không thể tải danh sách tour"
        );
      }
    } catch (error) {
      console.error("Error fetching tours:", error);

      if (error.response) {
        console.log("Error response status:", error.response.status);
        console.log("Error response data:", error.response.data);
      }

      if (error.response?.status === 401) {
        setError("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        handleTokenExpired();
      } else if (error.response?.status === 403) {
        setError("Bạn không có quyền truy cập trang này.");
      } else if (error.response?.status === 404) {
        setError(
          "Không tìm thấy API hoặc dữ liệu. Vui lòng kiểm tra lại đường dẫn."
        );
      } else {
        setError(error.message || "Có lỗi xảy ra khi tải danh sách tour");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, handleTokenExpired]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const filteredTours = tours.filter((tour) => {
    const tourStatus = tour.status || "pending";
    
    const isActive = Boolean(tour.is_active);

    if (activeTab === "all") return isActive;
    if (activeTab === "hidden") return !isActive;
    if (activeTab === "pending") return isActive && (tourStatus === "pending" || !tour.status);
    
    return isActive && tourStatus === activeTab;
  });

  console.log(
    `Lọc theo tab '${activeTab}': ${filteredTours.length}/${tours.length} tours`
  );

  const handleRestoreTour = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục tour này không? Tour sẽ được đặt lại về trạng thái "Chờ duyệt".')) return;

    try {
      setProcessingTourId(id);
      const currentToken = getToken();
      
      const response = await axios.put(`${CONFIG.API_API_URL}/tours/admin/tours/${id}/restore`, {}, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (response.data.success) {
        toast.success('Tour đã được khôi phục và đặt lại về trạng thái "Chờ duyệt" thành công!');
        setTours((prevTours) =>
          prevTours.map((tour) =>
            tour.id === id ? { ...tour, is_active: true, status: 'pending' } : tour
          )
        );
      }
    } catch (error) {
      console.error("Restore tour error:", error);
      toast.error(error.response?.data?.message || 'Lỗi khi khôi phục tour!');
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleHideTour = async (id) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn ẩn tour này không? Tour sẽ được chuyển sang trạng thái 'Từ chối' và không hiển thị công khai."
      )
    )
      return;

    try {
      setProcessingTourId(id);
      const currentToken = getToken();

      if (!currentToken) {
        toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        handleTokenExpired();
        return;
      }

      const response = await axios.put(
        `${CONFIG.API_API_URL}/tours/admin/tours/${id}/hide`,
        {},
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Tour đã được ẩn và chuyển sang trạng thái 'Từ chối' thành công!");
        setTours((prevTours) =>
          prevTours.map((tour) =>
            tour.id === id ? { ...tour, is_active: false, status: 'rejected' } : tour
          )
        );
      }
    } catch (error) {
      console.error("Hide tour error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi ẩn tour!");

      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleDeleteTour = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tour này không?")) return;

    try {
      setProcessingTourId(id);
      const currentToken = getToken();

      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      const tourToDelete = tours.find((tour) => tour.id === id);

      if (user.role !== "admin" && tourToDelete.user_id !== user.id) {
        toast.error("Bạn không có quyền xóa tour này!");
        return;
      }

      const response = await axios.delete(
        `${CONFIG.API_API_URL}/tours/${id}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Tour đã được xóa thành công!");
        setTours((prevTours) => prevTours.filter((tour) => tour.id !== id));
      }
    } catch (error) {
      console.error("Delete tour error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa tour!");

      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleEditTour = (tour) => {
    if (user.role !== "admin" && tour.user_id !== user.id) {
      toast.error("Bạn không có quyền chỉnh sửa tour này!");
      return;
    }

    setCurrentTour(tour);
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (formData) => {
    try {
      setIsSubmitting(true);
      const currentToken = getToken();

      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      const tourData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "image") {
          if (typeof formData[key] === "object") {
            tourData.append(key, JSON.stringify(formData[key]));
          } else {
            tourData.append(key, formData[key]);
          }
        }
      });

      if (formData.image instanceof File) {
        tourData.append("image", formData.image);
      }

      if (user.role !== "admin") {
        tourData.append("status", "pending");
      }

      const response = await axios.put(
        `${CONFIG.API_API_URL}/tours/${currentTour.id}`,
        tourData,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data.success) {
        fetchTours();
        setShowEditModal(false);
        toast.success("Tour đã được cập nhật thành công!");
      }
    } catch (error) {
      console.error("Error updating tour:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật tour!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTour = async (formData) => {
    try {
      setIsSubmitting(true);
      const currentToken = getToken();

      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      if (
        !formData.destination ||
        !formData.departure_from ||
        !formData.duration ||
        !formData.description
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin cơ bản của tour");
        setIsSubmitting(false);
        return;
      }

      if (
        !formData.schedule ||
        !Array.isArray(formData.schedule) ||
        formData.schedule.length === 0
      ) {
        toast.error("Lịch trình tour phải có ít nhất một ngày");
        setIsSubmitting(false);
        return;
      }

      const tourData = {
        destination: formData.destination,
        departure_from: formData.departure_from,
        departure_date: formData.departure_date || null,
        return_date: formData.return_date || null,
        duration: formData.duration,
        description: formData.description,
        highlights: Array.isArray(formData.highlights)
          ? formData.highlights.filter((h) => h && h.trim())
          : [],
        schedule: formData.schedule.map((day) => ({
          day: day.day || "Ngày",
          title: day.title || "",
          activities: Array.isArray(day.activities)
            ? day.activities.filter((a) => a && a.trim())
            : [],
          locations: Array.isArray(day.locations)
            ? day.locations.map((locId) => parseInt(locId, 10))
            : [],
        })),
        includes: Array.isArray(formData.includes)
          ? formData.includes.filter((i) => i && i.trim())
          : [],
        excludes: Array.isArray(formData.excludes)
          ? formData.excludes.filter((e) => e && e.trim())
          : [],
        notes: Array.isArray(formData.notes)
          ? formData.notes.filter((n) => n && n.trim())
          : [],
        selected_location_ids: Array.isArray(formData.selected_location_ids)
          ? formData.selected_location_ids.map((id) => parseInt(id, 10))
          : [],
      };

      if (formData.image instanceof File) {
        const tourFormData = new FormData();

        tourFormData.append("image", formData.image);

        tourFormData.append("destination", tourData.destination);
        tourFormData.append("departure_from", tourData.departure_from);
        if (tourData.departure_date)
          tourFormData.append("departure_date", tourData.departure_date);
        if (tourData.return_date)
          tourFormData.append("return_date", tourData.return_date);
        tourFormData.append("duration", tourData.duration);
        tourFormData.append("description", tourData.description);

        tourFormData.append("highlights", JSON.stringify(tourData.highlights));
        tourFormData.append("schedule", JSON.stringify(tourData.schedule));
        tourFormData.append("includes", JSON.stringify(tourData.includes));
        tourFormData.append("excludes", JSON.stringify(tourData.excludes));
        tourFormData.append("notes", JSON.stringify(tourData.notes));
        tourFormData.append(
          "selected_location_ids",
          JSON.stringify(tourData.selected_location_ids)
        );

        const response = await axios.post(
          `${CONFIG.API_API_URL}/tours`,
          tourFormData,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Tour đã được tạo thành công!");
          setShowAddModal(false);
          resetFormData();
          fetchTours();
        }
      } else {
        const response = await axios.post(
          `${CONFIG.API_API_URL}/tours`,
          tourData,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          toast.success("Tour đã được tạo thành công!");
          setShowAddModal(false);
          resetFormData();
          fetchTours();
        }
      }
    } catch (error) {
      console.error("Error creating tour:", error);
      if (error.response && error.response.data) {
        console.log("Server response:", error.response.data);
        toast.error(
          `Lỗi: ${
            error.response.data.message || error.message || "Không thể tạo tour"
          }`
        );
      } else {
        toast.error(`Lỗi: ${error.message || "Không thể tạo tour"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetFormData = () => {
    setNewTourFormData({
      destination: "",
      departure_from: "",
      departure_date: "",
      return_date: "",
      duration: "",
      description: "",
      image: null,
      highlights: [""],
      schedule: [
        {
          day: "Ngày 1",
          title: "",
          activities: [""],
          locations: [],
        },
      ],
      includes: ["Xe du lịch đời mới máy lạnh", "Khách sạn tiêu chuẩn 3 sao"],
      excludes: ["Chi phí cá nhân", "Tiền tip cho hướng dẫn viên"],
      notes: ["Quý khách vui lòng mang theo giấy tờ tùy thân"],
    });
  };

  /* REMOVED unused variable
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="status-badge status-approved">Đã duyệt</span>;
      case "pending":
        return <span className="status-badge status-pending">Chờ duyệt</span>;
      case "rejected":
        return <span className="status-badge status-rejected">Từ chối</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };
  */

  const canModerateContent = useCallback(() => {
    return user?.role === "admin";
  }, [user]);

  const handleApproveTour = async (tourId) => {
    try {
      console.log("[TourManagement] Approve tour:", tourId);
      setProcessingTourId(tourId);

      const currentToken = getToken();
      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      const response = await axios.put(
        `${CONFIG.API_API_URL}/tours/admin/tours/${tourId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Đã duyệt tour thành công!");
        await fetchTours();
      } else {
        throw new Error(response.data.message || "Lỗi khi duyệt tour");
      }
    } catch (error) {
      console.error("[TourManagement] Error approving tour:", error);

      if (error.response?.status === 401) {
        handleTokenExpired();
      } else {
        toast.error(
          error.response?.data?.message || error.message || "Lỗi khi duyệt tour"
        );
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  const handleRejectTour = async (tourId) => {
    try {
      console.log("[TourManagement] Reject tour:", tourId);
      setProcessingTourId(tourId);

      const currentToken = getToken();
      if (!currentToken) {
        handleTokenExpired();
        return;
      }

      const response = await axios.put(
        `${CONFIG.API_API_URL}/tours/admin/tours/${tourId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Đã từ chối tour thành công!");
        await fetchTours();
      } else {
        throw new Error(response.data.message || "Lỗi khi từ chối tour");
      }
    } catch (error) {
      console.error("[TourManagement] Error rejecting tour:", error);

      if (error.response?.status === 401) {
        handleTokenExpired();
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Lỗi khi từ chối tour"
        );
      }
    } finally {
      setProcessingTourId(null);
    }
  };

  return (
    <div className="tour-management">
      <ToastContainer />
      <div className="tour-header-wrapper">
        <h1 className="page-title">
          {user?.role === "admin" ? "Quản lý kế hoạch" : "Tour của tôi"}
        </h1>
        <button onClick={() => setShowAddModal(true)} className="add-button">
          Thêm kế hoạch mới
        </button>
      </div>

      <div className="status-filter-tabs">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          {/* ✅ SỬA LỖI: Dùng Boolean() để convert */}
          Tất cả ({tours.filter(t => Boolean(t.is_active)).length})
        </button>
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Chờ duyệt (
          {tours.filter((t) => Boolean(t.is_active) && (!t.status || t.status === "pending")).length})
        </button>
        <button
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Đã duyệt ({tours.filter((t) => Boolean(t.is_active) && t.status === "approved").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          Từ chối ({tours.filter((t) => Boolean(t.is_active) && t.status === "rejected").length})
        </button>
        <button
          className={`tab-btn ${activeTab === "hidden" ? "active" : ""}`}
          onClick={() => setActiveTab("hidden")}
        >
          {/* ✅ SỬA LỖI: Đếm tour có is_active falsy */}
          Tour ẩn ({tours.filter(t => !Boolean(t.is_active)).length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : error ? (
        <div className="error-state">Lỗi: {error}</div>
      ) : filteredTours.length === 0 ? (
        <div className="empty-state">
          <p>Không có tour nào trong danh sách này</p>
        </div>
      ) : (
        <TourList
          tours={filteredTours}
          onApprove={handleApproveTour}
          onReject={handleRejectTour}
          onEdit={handleEditTour}
          onHide={handleHideTour}
          onRestore={handleRestoreTour}
          onDelete={handleDeleteTour}
          currentUserId={user?.id}
          canModerate={canModerateContent()}
          processingTourId={processingTourId}
        />
      )}

      {showEditModal && currentTour && (
        <EditTourModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          formData={currentTour}
          setFormData={setCurrentTour}
          tourId={currentTour.id} // ✅ BỔ SUNG: Truyền ID để modal fetch full data
          onSubmit={handleSubmitEdit}
          isSubmitting={isSubmitting}
        />
      )}

      {showAddModal && (
        <AddTourModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          formData={newTourFormData}
          setFormData={setNewTourFormData}
          onSubmit={handleAddTour}
          isSubmitting={isSubmitting}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default TourManagement;
