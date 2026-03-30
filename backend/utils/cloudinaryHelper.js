const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload file từ buffer lên Cloudinary
 * @param {Buffer} fileBuffer - Buffer của file (từ req.files.file.data)
 * @param {String} folder - Thư mục trên Cloudinary (ví dụ: 'avatars', 'tours')
 * @returns {Promise<Object>} - Trả về { url, public_id }
 */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `travel_phuyen/${folder}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Xóa ảnh trên Cloudinary
 * @param {String} publicId - Public ID của ảnh
 */
const removeFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

/**
 * Tiện ích trích xuất Public ID từ URL Cloudinary (nếu cần)
 * @param {String} url 
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1]; // "public_id.jpg"
  const folderPart = parts[parts.length - 2]; // "folder_name"
  const publicIdWithExt = `${folderPart}/${lastPart}`; // "folder/public_id.jpg"
  return publicIdWithExt.split('.')[0];
};

module.exports = {
  uploadToCloudinary,
  removeFromCloudinary,
  getPublicIdFromUrl
};
