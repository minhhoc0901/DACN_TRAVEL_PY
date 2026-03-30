require('dotenv').config();
const { pool } = require('../config/db');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const fs = require('fs');
const path = require('path');

const configs = [
    { table: 'Users', column: 'avatar', folder: 'avatars' },
    { table: 'Tours', column: 'image', folder: 'tours' },
    { table: 'Hotels', column: 'image', folder: 'hotels' },
    { table: 'Location_Images', column: 'image_url', folder: 'locations', idColumn: 'id' },
    { table: 'Review_Images', column: 'image_url', folder: 'reviews', idColumn: 'id' }
];

async function migrate() {
    console.log('🚀 Bắt đầu quá trình di chuyển ảnh lên Cloudinary...');
    let totalSuccess = 0;
    let totalError = 0;
    let totalSkipped = 0;

    for (const config of configs) {
        const { table, column, folder, idColumn = 'id' } = config;
        console.log(`\n--------------------------------------------------`);
        console.log(`📁 Đang xử lý bảng: ${table} (${column})`);
        
        try {
            // Lấy các bản ghi có đường dẫn /uploads/
            const [rows] = await pool.query(`SELECT ${idColumn}, ${column} FROM ${table} WHERE ${column} LIKE '/uploads/%'`);
            
            console.log(`🔍 Tìm thấy ${rows.length} bản ghi cần chuyển đổi.`);

            for (const row of rows) {
                const localUrl = row[column];
                const id = row[idColumn];

                // Chuyển URL /uploads/... thành đường dẫn file tuyệt đối
                // Lưu ý: localUrl bắt đầu bằng / nên path.join sẽ xử lý đúng
                const filePath = path.join(__dirname, '..', localUrl);

                if (fs.existsSync(filePath)) {
                    try {
                        const fileBuffer = fs.readFileSync(filePath);
                        console.log(`   ⬆️ Đang upload: ${localUrl} (ID: ${id})`);
                        
                        const result = await uploadToCloudinary(fileBuffer, folder);
                        const cloudUrl = result.url;

                        // Cập nhật Database
                        await pool.query(`UPDATE ${table} SET ${column} = ? WHERE ${idColumn} = ?`, [cloudUrl, id]);
                        
                        console.log(`   ✅ Thành công!`);
                        totalSuccess++;
                    } catch (uploadErr) {
                        console.error(`   ❌ Lỗi upload/update:`, uploadErr.message);
                        totalError++;
                    }
                } else {
                    console.log(`   ⚠️ Bỏ qua: File không tồn tại tại ${filePath}`);
                    totalSkipped++;
                }
            }
        } catch (dbErr) {
            console.error(`❌ Lỗi truy vấn bảng ${table}:`, dbErr.message);
        }
    }

    console.log(`\n==================================================`);
    console.log(`🏁 Hoàn tất di chuyển!`);
    console.log(`✅ Thành công: ${totalSuccess}`);
    console.log(`⚠️ Bỏ qua: ${totalSkipped}`);
    console.log(`❌ Lỗi: ${totalError}`);
    console.log(`==================================================`);
    
    process.exit(0);
}

migrate();
