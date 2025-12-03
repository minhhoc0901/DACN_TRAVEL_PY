const Location = require('../models/Location');
const path = require('path');
const fs = require('fs');

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


const handleFileUpload = async (file, locationId, type, index = '') => {
    try {
        if (!file || !locationId) {
            throw new Error('Missing required parameters');
        }

        const uploadDir = path.join(__dirname, '../uploads/locations', locationId.toString());
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = path.extname(file.name);
        const fileName = createImageFileName(locationId, type, index);
        const filePath = path.join(uploadDir, fileName);
        
        await file.mv(filePath);
        return `/uploads/locations/${locationId}/${fileName}`;
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
};
// Helper function to create image filename
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

        // Create location first
        const locationId = await Location.createLocation(parsedData);

        // Handle file uploads if any
        if (req.files) {
            // Handle main images
            if (req.files.introductionImage) {
                await Location.saveImage(
                    locationId,
                    req.files.introductionImage,
                    'introduction'
                );
            }

            if (req.files.architectureImage) {
                await Location.saveImage(
                    locationId,
                    req.files.architectureImage,
                    'architecture'
                );
            }

            // Handle experience images - sử dụng getExperienceId để lấy ID thực
            for (let i = 0; i < parsedData.experiences.length; i++) {
                const key = `experienceImage_${i}`;
                if (req.files[key]) {
                    // Lấy ID thực của experience
                    const experienceId = await Location.getExperienceId(locationId, i);
                    if (experienceId) {
                        await Location.saveImage(
                            locationId,
                            req.files[key],
                            'experience',
                            experienceId  // Sử dụng ID thực
                        );
                    }
                }
            }

            // Handle cuisine images - sử dụng getCuisineId để lấy ID thực
            for (let i = 0; i < parsedData.cuisines.length; i++) {
                const key = `cuisineImage_${i}`;
                if (req.files[key]) {
                    // Lấy ID thực của cuisine
                    const cuisineId = await Location.getCuisineId(locationId, i);
                    if (cuisineId) {
                        await Location.saveImage(
                            locationId,
                            req.files[key],
                            'cuisine',
                            cuisineId  // Sử dụng ID thực
                        );
                    }
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
        const introUrl = await handleFileUpload(
            files.introductionImage,
            locationId,
            'introduction'
        );
        await Location.saveImage(locationId, introUrl, 'introduction');
    }

    // Handle architecture image
    if (files.architectureImage) {
        const archUrl = await handleFileUpload(
            files.architectureImage,
            locationId,
            'architecture'
        );
        await Location.saveImage(locationId, archUrl, 'architecture');
    }

    // Handle experience images
    const experienceFiles = Object.keys(files)
        .filter(key => key.startsWith('experienceImage_'));
    
    for (const key of experienceFiles) {
        const index = parseInt(key.split('_')[1]);
        const imageUrl = await handleFileUpload(
            files[key],
            locationId,
            'experience',
            index + 1
        );
        await Location.saveImage(locationId, imageUrl, 'experience', index + 1);
    }

    // Handle cuisine images
    const cuisineFiles = Object.keys(files)
        .filter(key => key.startsWith('cuisineImage_'));
    
    for (const key of cuisineFiles) {
        const index = parseInt(key.split('_')[1]);
        const imageUrl = await handleFileUpload(
            files[key],
            locationId,
            'cuisine',
            index + 1
        );
        await Location.saveImage(locationId, imageUrl, 'cuisine', index + 1);
    }
};

// Hàm helper để tạo thư mục
const createUploadDirs = (locationId) => {
    const basePath = path.join(__dirname, '../uploads/locations', locationId.toString());
    const dirs = ['introduction', 'architecture', 'experience', 'cuisine'];
    
    dirs.forEach(dir => {
        const fullPath = path.join(basePath, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
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
            // Get the experience ID
            const experienceId = await Location.getExperienceId(locationId, i);
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
            // Get the cuisine ID
            const cuisineId = await Location.getCuisineId(locationId, i);
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

        const image = req.files.image;
        const uploadDir = path.join(__dirname, '../uploads/locations', locationId.toString());

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Đặt tên file ảnh
        const fileName = `${locationId}-${imageType}-${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        const imageUrl = `/uploads/locations/${locationId}/${fileName}`;

        // Lưu file ảnh
        await image.mv(filePath);

        // Lưu đường dẫn vào database
        await Location.saveImage(locationId, imageUrl, imageType);

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

        // Lấy thông tin ảnh từ database
        const image = await Location.getImageById(imageId);
        if (!image) {
            return res.status(404).json({ error: 'Không tìm thấy ảnh' });
        }

        // Xóa file ảnh
        const filePath = path.join(__dirname, '..', image.image_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Xóa record trong database
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
        const imageUrl = await handleFileUpload(
            files[key],
            locationId,
            'experiences',
            index
        );
        
        // Lấy ID của experience tương ứng
        const experienceId = await Location.getExperienceId(locationId, index);
        if (experienceId) {
            await Location.saveImage(locationId, imageUrl, 'experience', experienceId);
        }
    }

    // Xử lý ảnh cuisines
    const cuisineFiles = Object.keys(files)
        .filter(key => key.startsWith('cuisineImage_'));

    for (const key of cuisineFiles) {
        const index = key.split('_')[1];
        const imageUrl = await handleFileUpload(
            files[key],
            locationId,
            'cuisines',
            index
        );
        
        // Lấy ID của cuisine tương ứng
        const cuisineId = await Location.getCuisineId(locationId, index);
        if (cuisineId) {
            await Location.saveImage(locationId, imageUrl, 'cuisine', cuisineId);
        }
    }
};