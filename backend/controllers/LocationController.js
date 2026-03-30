const Location = require('../models/Location');

exports.searchLocations = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ success: false, message: "Thiếu từ khóa tìm kiếm." });
    }
    const locations = await Location.searchLocations(keyword.trim());

    // Bổ sung ảnh giới thiệu cho mỗi địa điểm
    for (const location of locations) {
      const introImage = await Location.getImage(location.id, 'introduction');
      location.introduction = {
        text: location.introduction,
        image: introImage
      };
    }

    res.status(200).json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm địa điểm',
      error: error.message
    });
  }
};


// Helper function to create image filename (Keep if needed, though model has it too)
const createImageFileName = (locationId, type, index = '') => {
    switch(type) {
        case 'introduction': 
            return `${locationId}-intro.jpg`;
        case 'architecture': 
            return `${locationId}-arch.jpg`;
        case 'experience': 
            return `${locationId}-exp-${index}.jpg`;
        case 'cuisine': 
            return `${locationId}-cui-${index}.jpg`;
        default: 
            return `${locationId}-${type}-${Date.now()}.jpg`;
    }
};



exports.createLocation = async (req, res) => {
    try {
        const data = req.body;
        console.log('Received data:', data);

        // Parse JSON fields
        const parsedData = {
            ...data,
            bestTimes: JSON.parse(data.bestTimes || '[]'),
            travelMethods: JSON.parse(data.travelMethods || '{"fromTuyHoa":[],"fromElsewhere":[]}'),
            experiences: JSON.parse(data.experiences || '[]'),
            cuisines: JSON.parse(data.cuisines || '[]'),
            tips: JSON.parse(data.tips || '[]'),
            nearby: JSON.parse(data.nearby || '[]'),
            hotel_ids: JSON.parse(data.hotel_ids || '[]') 
        };

        // Đánh dấu items có ảnh để Model biết và không bỏ qua (đối với create)
        if (req.files) {
            parsedData.experiences = parsedData.experiences.map((exp, i) => ({
                ...exp,
                hasImage: !!req.files[`experienceImage_${i}`]
            }));
            parsedData.cuisines = parsedData.cuisines.map((c, i) => ({
                ...c,
                hasImage: !!req.files[`cuisineImage_${i}`]
            }));
        }

        // Create location first
        const { locationId, experienceIds, cuisineIds } = await Location.createLocation(parsedData);

        // Handle file uploads if any
        if (req.files) {
            // Handle main images
            if (req.files.introductionImage) {
                await Location.saveImage(locationId, req.files.introductionImage, 'introduction');
            }

            if (req.files.architectureImage) {
                await Location.saveImage(locationId, req.files.architectureImage, 'architecture');
            }

            // Handle experience images
            for (let i = 0; i < (experienceIds?.length || 0); i++) {
                const key = `experienceImage_${i}`;
                if (req.files[key] && experienceIds[i]) {
                    await Location.saveImage(locationId, req.files[key], 'experience', experienceIds[i]);
                }
            }

            // Handle cuisine images
            for (let i = 0; i < (cuisineIds?.length || 0); i++) {
                const key = `cuisineImage_${i}`;
                if (req.files[key] && cuisineIds[i]) {
                    await Location.saveImage(locationId, req.files[key], 'cuisine', cuisineIds[i]);
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Thêm địa điểm thành công',
            locationId
        });

    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm địa điểm',
            error: error.message
        });
    }
};

// Helper function to handle image uploads
const handleLocationImages = async (files, locationId, data) => {
    // Handle introduction image
    if (files.introductionImage) {
        await Location.saveImage(locationId, files.introductionImage, 'introduction');
    }

    // Handle architecture image
    if (files.architectureImage) {
        await Location.saveImage(locationId, files.architectureImage, 'architecture');
    }

    // Handle experience images
    const experienceFiles = Object.keys(files)
        .filter(key => key.startsWith('experienceImage_'));
    
    for (const key of experienceFiles) {
        const index = parseInt(key.split('_')[1]);
        await Location.saveImage(locationId, files[key], 'experience', index + 1);
    }

    // Handle cuisine images
    const cuisineFiles = Object.keys(files)
        .filter(key => key.startsWith('cuisineImage_'));
    
    for (const key of cuisineFiles) {
        const index = parseInt(key.split('_')[1]);
        await Location.saveImage(locationId, files[key], 'cuisine', index + 1);
    }
};

// Hàm helper để tạo thư mục
// Bỏ tạo thư mục local
const createUploadDirs = (locationId) => {
    // Không cần thiết khi dùng Cloudinary
};
// Read: Lấy tất cả địa điểm
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.getAllLocations();
        res.status(200).json(locations);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error.message);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Read: Lấy thông tin một địa điểm cụ thể
exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.getLocationById(req.params.id);
        if (!location) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }
        res.status(200).json(location);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error.message);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Update: Cập nhật thông tin một địa điểm cái này của updateLocation chưa sửa getbestim


exports.updateLocation = async (req, res) => {
    try {
      const locationId = req.params.id;
      const data = req.body;
      
      console.log('Starting location update process for ID:', locationId);
      console.log('Raw data received:', Object.keys(data));
    
      // Validate input data
      if (!data.name || !data.type) {
        return res.status(400).json({
          success: false,
          message: 'Tên và loại địa điểm là bắt buộc'
        });
      }
    
      // Create a fresh copy of data to avoid reference issues
      let parsedData = { ...data };
      
      // Parse JSON strings - handling all fields consistently
      const fieldsToProcess = ['bestTimes', 'tips', 'experiences', 'travelMethods', 'nearby', 'cuisines', 'hotel_ids']; // ✅ THÊM MỚI 'hotel_ids'
      
      for (const field of fieldsToProcess) {
        if (typeof data[field] === 'string') {
          try {
            parsedData[field] = JSON.parse(data[field]);
            console.log(`Parsed ${field}:`, Array.isArray(parsedData[field]) ? 
              `Array with ${parsedData[field].length} items` : 
              typeof parsedData[field]);
          } catch (e) {
            console.error(`Error parsing ${field}:`, e);
            // Use sensible defaults based on field type
            if (field === 'travelMethods') {
              parsedData[field] = { fromTuyHoa: [], fromElsewhere: [] };
            } else {
              parsedData[field] = [];
            }
          }
        }
      }
      
      console.log('Data prepared for update. Updating location in database...');
    
      // Update the location in the database
      const updated = await Location.updateLocation(locationId, parsedData);
      
      // Handle file uploads if any
      if (req.files) {
        console.log('Processing file uploads:', Object.keys(req.files));
        
        // Handle main images
        if (req.files.introductionImage) {
          console.log('Updating introduction image');
          await Location.saveImage(
            locationId,
            req.files.introductionImage,
            'introduction'
          );
        }
    
        if (req.files.architectureImage) {
          console.log('Updating architecture image');
          await Location.saveImage(
            locationId,
            req.files.architectureImage,
            'architecture'
          );
        }
    
        // Handle experience images
        for (let i = 0; i < parsedData.experiences.length; i++) {
          const key = `experienceImage_${i}`;
          if (req.files[key]) {
            console.log(`Updating experience image ${i}`);
            // Lấy ID từ đối tượng đã được Sync trong Model
            const experienceId = parsedData.experiences[i].id;
            if (experienceId) {
              await Location.saveImage(
                locationId,
                req.files[key],
                'experience',
                experienceId
              );
            } else {
              console.warn(`Could not find experience ID for index ${i}`);
            }
          }
        }
    
        // Handle cuisine images
        for (let i = 0; i < parsedData.cuisines.length; i++) {
          const key = `cuisineImage_${i}`;
          if (req.files[key]) {
            console.log(`Updating cuisine image ${i}`);
            // Lấy ID từ đối tượng đã được Sync trong Model
            const cuisineId = parsedData.cuisines[i].id;
            if (cuisineId) {
              await Location.saveImage(
                locationId,
                req.files[key],
                'cuisine',
                cuisineId
              );
            } else {
              console.warn(`Could not find cuisine ID for index ${i}`);
            }
          }
        }
      }
      
      if (updated) {
        console.log('Location update completed successfully');
        res.status(200).json({
          success: true,
          message: 'Cập nhật địa điểm thành công'
        });
      } else {
        console.error('Location update failed');
        res.status(400).json({
          success: false,
          message: 'Cập nhật địa điểm thất bại'
        });
      }
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật địa điểm',
        error: error.message
      });
    }
  };

// Delete: Xóa một địa điểm
exports.deleteLocation = async (req, res) => {
    try {
        const locationId = req.params.id;

        // Kiểm tra xem địa điểm có tồn tại không
        const existingLocation = await Location.getLocationById(locationId);
        if (!existingLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }

        const deleted = await Location.deleteLocation(locationId);
        if (deleted) {
            res.status(200).json({ message: 'Xóa địa điểm thành công' });
        } else {
            res.status(500).json({ error: 'Không thể xóa địa điểm' });
        }
    } catch (error) {
        console.error('Lỗi khi xóa địa điểm:', error.message);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Upload ảnh cho địa điểm
exports.uploadImage = async (req, res) => {
    try {
        const locationId = req.params.id;
        const imageType = req.body.imageType; // 'introduction', 'architecture', 'experience', 'cuisine'

        // Kiểm tra địa điểm tồn tại
        const existingLocation = await Location.getLocationById(locationId);
        if (!existingLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }

        if (!imageType) {
            return res.status(400).json({ error: 'Loại ảnh (imageType) là bắt buộc' });
        }

        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'Không có file ảnh được tải lên' });
        }

        // Lưu đường dẫn vào database và upload lên Cloudinary qua Model
        const resultUrl = await Location.saveImage(locationId, image, imageType);

        res.status(200).json({ 
            success: true,
            message: 'Upload ảnh lên Cloudinary thành công',
            imageUrl: resultUrl 
        });

        res.status(200).json({ 
            success: true,
            message: 'Upload ảnh thành công',
            imageUrl 
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi upload ảnh',
            error: error.message
        });
    }
};

// Xóa ảnh của địa điểm
exports.deleteImage = async (req, res) => {
    try {
        const { id: locationId, imageId } = req.params;

        // Kiểm tra địa điểm tồn tại
        const existingLocation = await Location.getLocationById(locationId);
        if (!existingLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }

        // Xóa record trong database (Model sẽ tự xóa trên Cloudinary)
        await Location.deleteImage(imageId);

        res.status(200).json({
            success: true,
            message: 'Xóa ảnh thành công'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa ảnh',
            error: error.message
        });
    }
};

// Thêm địa điểm lân cận
exports.addNearbyLocation = async (req, res) => {
    try {
        const { id: locationId } = req.params;
        const { nearbyId } = req.body;

        // Kiểm tra địa điểm tồn tại
        const existingLocation = await Location.getLocationById(locationId);
        if (!existingLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }

        // Kiểm tra địa điểm lân cận tồn tại
        const nearbyLocation = await Location.getLocationById(nearbyId);
        if (!nearbyLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm lân cận' });
        }

        await Location.addNearbyLocation(locationId, nearbyId);

        res.status(200).json({
            success: true,
            message: 'Thêm địa điểm lân cận thành công'
        });
    } catch (error) {
        console.error('Add nearby location error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm địa điểm lân cận',
            error: error.message
        });
    }
};

// Xóa địa điểm lân cận
exports.removeNearbyLocation = async (req, res) => {
    try {
        const { id: locationId, nearbyId } = req.params;

        // Kiểm tra địa điểm tồn tại
        const existingLocation = await Location.getLocationById(locationId);
        if (!existingLocation) {
            return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
        }

        await Location.removeNearbyLocation(locationId, nearbyId);

        res.status(200).json({
            success: true,
            message: 'Xóa địa điểm lân cận thành công'
        });
    } catch (error) {
        console.error('Remove nearby location error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa địa điểm lân cận',
            error: error.message
        });
    }
};


exports.getLocationByName = async (req, res) => {
    try {
      const name = req.params.name;
      const locations = await Location.getLocationByName(name);
      
      if (!locations || locations.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy địa điểm' 
        });
      }
      
      res.status(200).json({
        success: true,
        locations: locations
      });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin địa điểm:', error.message);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
};

// Helper function to handle experience and cuisine images
// This replaces the loose code at the end of the file
exports.handleMediaImages = async (req, files, locationId) => {
    // Xử lý ảnh experiences
    const experienceFiles = Object.keys(files)
        .filter(key => key.startsWith('experienceImage_'));

    for (const key of experienceFiles) {
        const index = key.split('_')[1];
        // Lấy ID của experience tương ứng
        const experienceId = await Location.getExperienceId(locationId, index);
        if (experienceId) {
            await Location.saveImage(locationId, files[key], 'experience', experienceId);
        }
    }

    // Xử lý ảnh cuisines
    const cuisineFiles = Object.keys(files)
        .filter(key => key.startsWith('cuisineImage_'));

    for (const key of cuisineFiles) {
        const index = key.split('_')[1];
        // Lấy ID của cuisine tương ứng
        const cuisineId = await Location.getCuisineId(locationId, index);
        if (cuisineId) {
            await Location.saveImage(locationId, files[key], 'cuisine', cuisineId);
        }
    }
};