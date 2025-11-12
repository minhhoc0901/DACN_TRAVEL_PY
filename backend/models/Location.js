
const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

// -------------------
// Truy vấn cơ bản
// -------------------

async function searchLocations(keyword) {
  try {
    const query = `
      SELECT DISTINCT
        l.id,
        l.name AS title,
        l.type,
        l.description,
        l.latitude,
        l.longitude,
        ld.introduction
      FROM Locations l
      LEFT JOIN LocationDetails ld ON l.id = ld.location_id
      WHERE LOWER(l.name) LIKE LOWER(?)
      ORDER BY l.name ASC
    `;
    const searchPattern = `%${keyword}%`;
    const [rows] = await pool.execute(query, [searchPattern]);
    return rows;
  } catch (error) {
    console.error('Database search error:', error);
    throw error;
  }
}


/**
 * Thêm một địa điểm mới vào các bảng Locations, LocationDetails và TravelInfo
 * @param {Object} data - Dữ liệu địa điểm (name, type, description, latitude, longitude,...)
 * @returns {Number} - ID của địa điểm vừa tạo
 */

async function createLocation(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert into Locations
    const [locationResult] = await connection.execute(
      `
            INSERT INTO Locations (name, type, description, latitude, longitude)
            VALUES (?, ?, ?, ?, ?)
        `,
      [
        data.name,
        data.type,
        data.description || "",
        parseFloat(data.latitude) || 0,
        parseFloat(data.longitude) || 0,
      ]
    );

    const locationId = locationResult.insertId;

    // 2. Insert LocationDetails
    await connection.execute(
      `
            INSERT INTO LocationDetails 
            (location_id, subtitle, introduction, why_visit_architecture_title, 
             why_visit_architecture_text, why_visit_culture)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        locationId,
        data.subtitle || "",
        data.introduction || "",
        data.why_visit_architecture_title || "",
        data.why_visit_architecture_text || "",
        data.why_visit_culture || "",
      ]
    );

    // 3. Insert TravelInfo
    await connection.execute(
      `
            INSERT INTO TravelInfo (location_id, ticket_price, tip)
            VALUES (?, ?, ?)
        `,
      [locationId, data.ticket_price || "", data.tip || ""]
    );

    // 4. Insert BestTimes
    if (Array.isArray(data.bestTimes) && data.bestTimes.length > 0) {
      const bestTimesValues = data.bestTimes
        .filter((time) => time && time.trim())
        .map((time) => [locationId, time]);

      if (bestTimesValues.length > 0) {
        await connection.query(
          `
                    INSERT INTO BestTimes (location_id, time_description) 
                    VALUES ?
                `,
          [bestTimesValues]
        );
      }
    }

    // 5. Insert TravelMethods
    if (data.travelMethods) {
      if (Array.isArray(data.travelMethods.fromTuyHoa)) {
        for (const method of data.travelMethods.fromTuyHoa) {
          if (method && method.trim()) {
            await connection.execute(
              "INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, ?, ?)",
              [locationId, "fromTuyHoa", method]
            );
          }
        }
      }

      if (Array.isArray(data.travelMethods.fromElsewhere)) {
        for (const method of data.travelMethods.fromElsewhere) {
          if (method && method.trim()) {
            await connection.execute(
              "INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, ?, ?)",
              [locationId, "fromElsewhere", method]
            );
          }
        }
      }
    }

    // 6. Insert Experiences
    if (Array.isArray(data.experiences)) {
      for (const exp of data.experiences) {
        if (exp && exp.text) {
          await connection.execute(
            "INSERT INTO Experiences (location_id, description) VALUES (?, ?)",
            [locationId, exp.text]
          );
        }
      }
    }

    // 7. Insert Cuisines
    if (Array.isArray(data.cuisines)) {
      for (const cuisine of data.cuisines) {
        if (cuisine && cuisine.text) {
          await connection.execute(
            "INSERT INTO Cuisines (location_id, description) VALUES (?, ?)",
            [locationId, cuisine.text]
          );
        }
      }
    }

    // 8. Insert Tips
    if (Array.isArray(data.tips)) {
      const tipsValues = data.tips
        .filter((tip) => tip && tip.trim())
        .map((tip) => [locationId, tip]);

      if (tipsValues.length > 0) {
        await connection.query(
          `
                    INSERT INTO Tips (location_id, description) 
                    VALUES ?
                `,
          [tipsValues]
        );
      }
    }

    // 9. Insert NearbyLocations
    if (Array.isArray(data.nearby)) {
      for (const nearbyId of data.nearby) {
        if (nearbyId) {
          await connection.execute(
            "INSERT INTO NearbyLocations (location_id, nearby_location_id) VALUES (?, ?)",
            [locationId, nearbyId]
          );
        }
      }
    }

    await connection.commit();
    return locationId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getNearbyLocations(locationId) {
  const query = `
        SELECT l.id, l.name
        FROM Locations l
        JOIN NearbyLocations n ON l.id = n.nearby_location_id
        WHERE n.location_id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  return rows;
}

/**
 * Lấy thông tin cơ bản của tất cả địa điểm
 * @returns {Array} - Danh sách địa điểm với thông tin cơ bản
 */
async function getBasicLocations() {
  const query = `
        SELECT 
            l.id,
            l.name AS title,
            l.type,
            l.description,
            l.latitude,
            l.longitude,
            ld.subtitle,
            ld.introduction,
            ld.why_visit_architecture_title,
            ld.why_visit_architecture_text,
            ld.why_visit_culture,
            ti.ticket_price,
            ti.tip
        FROM Locations l
        LEFT JOIN LocationDetails ld ON l.id = ld.location_id
        LEFT JOIN TravelInfo ti ON l.id = ti.location_id;
    `;
  const [rows] = await pool.execute(query);
  return rows;
}

/**
 * Lấy thông tin cơ bản của một địa điểm theo ID
 * @param {Number} locationId - ID của địa điểm
 * @returns {Object|null} - Thông tin cơ bản của địa điểm hoặc null nếu không tìm thấy
 */
async function getBasicLocationById(locationId) {
  const query = `
        SELECT 
            l.id,
            l.name AS title,
            l.type,
            l.description,
            l.latitude,
            l.longitude,
            ld.subtitle,
            ld.introduction,
            ld.why_visit_architecture_title,
            ld.why_visit_architecture_text,
            ld.why_visit_culture,
            ti.ticket_price,
            ti.tip
        FROM Locations l
        LEFT JOIN LocationDetails ld ON l.id = ld.location_id
        LEFT JOIN TravelInfo ti ON l.id = ti.location_id
        WHERE l.id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  return rows[0] || null;
}

/**
 * Cập nhật thông tin một địa điểm
 * @param {Number} locationId - ID của địa điểm
 * @param {Object} data - Dữ liệu cần cập nhật
 * @returns {Boolean} - True nếu cập nhật thành công
 */

// Add helper function for safe JSON parsing
function safeJSONParse(data, defaultValue) {
  if (!data) return defaultValue;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('JSON parse error:', e);
    return defaultValue;
  }
}
async function updateLocation(locationId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`Starting transaction for location update ID: ${locationId}`);

    // Input validation
    if (!locationId || !data) {
      throw new Error('Invalid input data');
    }

    // Parse data safely
    const parsedData = {
      ...data,
      bestTimes: safeJSONParse(data.bestTimes, []),
      tips: safeJSONParse(data.tips, []),
      travelMethods: safeJSONParse(data.travelMethods, { fromTuyHoa: [], fromElsewhere: [] }),
      nearby: safeJSONParse(data.nearby, []),
      experiences: safeJSONParse(data.experiences, []),
      cuisines: safeJSONParse(data.cuisines, [])
    };

    console.log('Updating base location info');
    // Update base location info
    await connection.execute(
      `UPDATE Locations 
       SET name = ?, type = ?, description = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        data.name, 
        data.type, 
        data.description || '', 
        parseFloat(data.latitude) || 0, 
        parseFloat(data.longitude) || 0, 
        locationId
      ]
    );

    console.log('Updating location details');
    // Update location details - check if exists first
    const [detailsCheck] = await connection.execute(
      'SELECT location_id FROM LocationDetails WHERE location_id = ?',
      [locationId]
    );

    if (detailsCheck.length > 0) {
      await connection.execute(
        `UPDATE LocationDetails 
         SET subtitle = ?, introduction = ?, 
             why_visit_architecture_title = ?, 
             why_visit_architecture_text = ?,
             why_visit_culture = ?
         WHERE location_id = ?`,
        [
          data.subtitle || '', 
          data.introduction || '',
          data.why_visit_architecture_title || '',
          data.why_visit_architecture_text || '',
          data.why_visit_culture || '',
          locationId
        ]
      );
    } else {
      // Insert if not exists
      await connection.execute(
        `INSERT INTO LocationDetails 
         (location_id, subtitle, introduction, why_visit_architecture_title, 
          why_visit_architecture_text, why_visit_culture)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          locationId,
          data.subtitle || '', 
          data.introduction || '',
          data.why_visit_architecture_title || '',
          data.why_visit_architecture_text || '',
          data.why_visit_culture || '',
        ]
      );
    }

    // Update travel info
    const [travelInfoCheck] = await connection.execute(
      'SELECT location_id FROM TravelInfo WHERE location_id = ?',
      [locationId]
    );

    if (travelInfoCheck.length > 0) {
      await connection.execute(
        `UPDATE TravelInfo 
         SET ticket_price = ?, tip = ?
         WHERE location_id = ?`,
        [data.ticket_price || '', data.tip || '', locationId]
      );
    } else {
      await connection.execute(
        `INSERT INTO TravelInfo (location_id, ticket_price, tip)
         VALUES (?, ?, ?)`,
        [locationId, data.ticket_price || '', data.tip || '']
      );
    }

    console.log('Updating best times');
    // Update best times with error handling
    await connection.execute('DELETE FROM BestTimes WHERE location_id = ?', [locationId]);
    if (Array.isArray(parsedData.bestTimes)) {
      for (const time of parsedData.bestTimes) {
        if (time && typeof time === 'string') {
          await connection.execute(
            'INSERT INTO BestTimes (location_id, time_description) VALUES (?, ?)',
            [locationId, time.trim()]
          );
        }
      }
    }

    console.log('Updating travel methods');
    // Update travel methods with validation
    await connection.execute('DELETE FROM TravelMethods WHERE location_id = ?', [locationId]);
    const { fromTuyHoa = [], fromElsewhere = [] } = parsedData.travelMethods;
    
    for (const method of fromTuyHoa) {
      if (method && typeof method === 'string') {
        await connection.execute(
          'INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, ?, ?)',
          [locationId, 'fromTuyHoa', method.trim()]
        );
      }
    }
    
    for (const method of fromElsewhere) {
      if (method && typeof method === 'string') {
        await connection.execute(
          'INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, ?, ?)',
          [locationId, 'fromElsewhere', method.trim()]
        );
      }
    }

    console.log('Updating tips');
    // Update tips with validation
    await connection.execute('DELETE FROM Tips WHERE location_id = ?', [locationId]);
    if (Array.isArray(parsedData.tips)) {
      for (const tip of parsedData.tips) {
        if (tip && typeof tip === 'string') {
          await connection.execute(
            'INSERT INTO Tips (location_id, description) VALUES (?, ?)',
            [locationId, tip.trim()]
          );
        }
      }
    }

    console.log('Updating nearby locations');
    // Update nearby with validation
    await connection.execute('DELETE FROM NearbyLocations WHERE location_id = ?', [locationId]);
    if (Array.isArray(parsedData.nearby)) {
      for (const nearbyId of parsedData.nearby) {
        if (nearbyId) {
          // Verify nearby location exists
          const [rows] = await connection.execute(
            'SELECT id FROM Locations WHERE id = ?',
            [nearbyId]
          );
          
          if (rows.length > 0 && Number(nearbyId) !== Number(locationId)) {
            await connection.execute(
              'INSERT INTO NearbyLocations (location_id, nearby_location_id) VALUES (?, ?)',
              [locationId, nearbyId]
            );
          }
        }
      }
    }

    console.log('Updating experiences');
    // Update experiences
    await connection.execute('DELETE FROM Experiences WHERE location_id = ?', [locationId]);
    if (Array.isArray(parsedData.experiences)) {
      for (const exp of parsedData.experiences) {
        if (exp && exp.text) {
          const [result] = await connection.execute(
            'INSERT INTO Experiences (location_id, description) VALUES (?, ?)',
            [locationId, exp.text.trim()]
          );
          
          // If there's a stored image URL and no new image file
          if (exp.imageUrl && !exp.image) {
            // We need to store the reference to maintain the image relationship
            const experienceId = result.insertId;
            
            // Extract the image type and existing reference ID if available
            // Format might be like: /uploads/locations/1/1-exp-1.jpg
            // We don't create a new image record here since the image itself is unchanged
            // That's handled separately when new images are uploaded
          }
        }
      }
    }

    console.log('Updating cuisines');
    // Update cuisines
    await connection.execute('DELETE FROM Cuisines WHERE location_id = ?', [locationId]);
    if (Array.isArray(parsedData.cuisines)) {
      for (const cuisine of parsedData.cuisines) {
        if (cuisine && cuisine.text) {
          const [result] = await connection.execute(
            'INSERT INTO Cuisines (location_id, description) VALUES (?, ?)',
            [locationId, cuisine.text.trim()]
          );
          
          // Similar to experiences, handle image references if needed
          if (cuisine.imageUrl && !cuisine.image) {
            const cuisineId = result.insertId;
            // Reference handling similar to experiences
          }
        }
      }
    }

    await connection.commit();
    console.log(`Transaction committed for location update ID: ${locationId}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Update location error details:', {
      locationId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function for safe JSON parsing
function safeJSONParse(data, defaultValue) {
  if (!data) return defaultValue;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('JSON parse error:', e);
    return defaultValue;
  }
}

/**
 * Xóa một địa điểm và tất cả dữ liệu liên quan
 * @param {Number} locationId - ID của địa điểm
 * @returns {Boolean} - True nếu xóa thành công
 */
async function deleteLocation(locationId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa dữ liệu liên quan trước
    const tables = [
      // "Ratings",
      // "User_Uploads",
      // "Comments",
      "LocationDetails",
      "TravelInfo",
      "BestTimes",
      "TravelMethods",
      "Experiences",
      "Cuisines",
      "Tips",
      "NearbyLocations",
      "Location_Images",
      "LocationHotels",
    ];

    // Xóa từ các bảng liên quan
    for (const table of tables) {
      await connection.execute(`DELETE FROM ${table} WHERE location_id = ?`, [
        locationId,
      ]);
    }

    // Xóa từ bảng Tour_Locations nếu có liên kết với tours
    await connection.execute(
      "DELETE FROM Tour_Locations WHERE location_id = ?",
      [locationId]
    );

    // Cuối cùng xóa từ bảng Locations
    await connection.execute("DELETE FROM Locations WHERE id = ?", [
      locationId,
    ]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// -------------------
// Truy vấn phụ (dữ liệu liên quan)
// -------------------

/**
 * Lấy ảnh của địa điểm theo loại ảnh
 * @param {Number} locationId - ID của địa điểm
 * @param {String} imageType - Loại ảnh (introduction, architecture, experience, cuisine)
 * @returns {String|null} - URL của ảnh hoặc null nếu không tìm thấy
 */

async function getImage(locationId, imageType, referenceId = null) {
  let query = `
        SELECT image_url 
        FROM Location_Images 
        WHERE location_id = ? AND image_type = ?
    `;
  const params = [locationId, imageType];

  if (referenceId) {
    query += ` AND reference_id = ?`;
    params.push(referenceId);
  } else {
    query += ` AND reference_id IS NULL`;
  }

  query += ` LIMIT 1`;
  const [rows] = await pool.execute(query, params);
  return rows[0]?.image_url || null;
}

/**
 * Lấy thời gian tốt nhất để tham quan
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách thời gian
 */


/**
 * Lấy danh sách mẹo
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách mẹo
 */

async function getBestTimes(locationId) {
  const query = `
    SELECT time_description
    FROM BestTimes
    WHERE location_id = ?;
  `;
  const [rows] = await pool.execute(query, [locationId]);
  const results = rows.map(row => row.time_description);
  console.log(`Retrieved ${results.length} best times for location ${locationId}`);
  return results;
}

async function getTips(locationId) {
  const query = `
    SELECT description
    FROM Tips
    WHERE location_id = ?;
  `;
  const [rows] = await pool.execute(query, [locationId]);
  const results = rows.map(row => row.description);
  console.log(`Retrieved ${results.length} tips for location ${locationId}`);
  return results;
}

/**
 * Lấy phương thức di chuyển
 * @param {Number} locationId - ID của địa điểm
 * @returns {Object} - Các phương thức di chuyển (fromTuyHoa, fromElsewhere)
 */
async function getTravelMethods(locationId) {
  const query = `
        SELECT method_type, description
        FROM TravelMethods
        WHERE location_id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  const result = { fromTuyHoa: [], fromElsewhere: [] };
  rows.forEach((row) => {
    if (row.method_type === "fromTuyHoa") {
      result.fromTuyHoa.push(row.description);
    } else if (row.method_type === "fromElsewhere") {
      result.fromElsewhere.push(row.description);
    }
  });
  return result;
}

/**
 * Lấy danh sách trải nghiệm
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách trải nghiệm
 */

async function getExperiences(locationId) {
  const query = `
      SELECT e.id, e.description
      FROM Experiences e
      WHERE e.location_id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  const experiences = [];
  for (const row of rows) {
    // Lấy ảnh cho trải nghiệm này, sử dụng id của trải nghiệm
    const image = await getImage(locationId, "experience", row.id);
    experiences.push({ text: row.description, image });
  }
  return experiences;
}
/**
 * Lấy danh sách ẩm thực
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách ẩm thực
 */
async function getCuisines(locationId) {
  const query = `
        SELECT c.id, c.description
        FROM Cuisines c
        WHERE c.location_id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  const cuisines = [];
  for (const row of rows) {
    const image = await getImage(locationId, "cuisine", row.id);
    cuisines.push({ text: row.description, image });
  }
  return cuisines;
}



/**
 * Lấy danh sách địa điểm gần đó
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách tên địa điểm gần đó
 */
// async function getNearbyLocations(locationId) {
//   const query = `
//         SELECT l2.name
//         FROM NearbyLocations nl
//         JOIN Locations l2 ON nl.nearby_location_id = l2.id
//         WHERE nl.location_id = ?;
//     `;
//   const [rows] = await pool.execute(query, [locationId]);
//   return rows.map((row) => row.name);
// }

async function getNearbyLocations(locationId) {
  const query = `
      SELECT nl.nearby_location_id as id, l2.name
      FROM NearbyLocations nl
      JOIN Locations l2 ON nl.nearby_location_id = l2.id
      WHERE nl.location_id = ?;
  `;
  const [rows] = await pool.execute(query, [locationId]);
  return rows;
}

/**
 * Lấy trung bình điểm đánh giá và số lượng đánh giá
 * @param {Number} locationId - ID của địa điểm
 * @returns {Object} - Trung bình điểm và số lượng đánh giá
 */
// async function getRatings(locationId) {
//   const query = `
//         SELECT AVG(rating) as averageRating, COUNT(rating) as ratingCount
//         FROM Ratings
//         WHERE location_id = ?;
//     `;
//   const [rows] = await pool.execute(query, [locationId]);
//   return {
//     averageRating: rows[0]?.averageRating || 0,
//     ratingCount: rows[0]?.ratingCount || 0,
//   };
// }

/**
 * Lấy danh sách bình luận
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách bình luận
 */
// async function getComments(locationId) {
//   const query = `
//         SELECT c.id, c.comment_text, c.created_at, u.username
//         FROM Comments c
//         JOIN Users u ON c.user_id = u.id
//         WHERE c.location_id = ?;
//     `;
//   const [rows] = await pool.execute(query, [locationId]);
//   return rows;
// }

/**
 * Lấy danh sách ảnh do người dùng tải lên
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách ảnh
 */
// async function getUserUploads(locationId) {
//   const query = `
//         SELECT image_url, uploaded_at, u.username
//         FROM User_Uploads uu
//         JOIN Users u ON uu.user_id = u.id
//         WHERE uu.location_id = ?;
//     `;
//   const [rows] = await pool.execute(query, [locationId]);
//   return rows;
// }

/**
 * Lấy danh sách khách sạn gần đó
 * @param {Number} locationId - ID của địa điểm
 * @returns {Array} - Danh sách khách sạn
 */
async function getNearbyHotels(locationId) {
  const query = `
        SELECT h.id, h.name, h.address, h.latitude, h.longitude
        FROM LocationHotels lh
        JOIN Hotels h ON lh.hotel_id = h.id
        WHERE lh.location_id = ?;
    `;
  const [rows] = await pool.execute(query, [locationId]);
  return rows;
}

// -------------------
// Hợp nhất dữ liệu
// -------------------


async function composeLocation(loc) {
  if (!loc) return null;

  const [
    introImage,
    archImage,
    bestTimes,
    travelMethods,
    experiences,
    cuisines,
    tips,
    nearby,
    // ratings,
    // comments,
    // userUploads,
    nearbyHotels,
  ] = await Promise.all([
    getImage(loc.id, "introduction"),
    getImage(loc.id, "architecture"),
    getBestTimes(loc.id),
    getTravelMethods(loc.id),
    getExperiences(loc.id),
    getCuisines(loc.id),
    getTips(loc.id),
    getNearbyLocations(loc.id),
    // getRatings(loc.id),
    // getComments(loc.id),
    // getUserUploads(loc.id),
    getNearbyHotels(loc.id),
  ]);

  // Đảm bảo các mảng được định dạng đúng
  const formattedBestTimes = Array.isArray(bestTimes) ? bestTimes : [];
  const formattedTips = Array.isArray(tips) ? tips : [];
  const formattedExperiences = Array.isArray(experiences) ? experiences : [];
  const formattedCuisines = Array.isArray(cuisines) ? cuisines : [];
  const formattedNearby = Array.isArray(nearby) ? nearby : [];

  return {
    id: loc.id,
    title: loc.title,
    type: loc.type,
    description: loc.description,
    coordinates: {
      latitude: loc.latitude,
      longitude: loc.longitude,
    },
    subtitle: loc.subtitle,
    introduction: {
      text: loc.introduction,
      image: introImage,
    },
    whyVisit: {
      architecture: {
        title: loc.why_visit_architecture_title,
        text: loc.why_visit_architecture_text,
        image: archImage,
      },
      culture: loc.why_visit_culture,
    },
    bestTimes: formattedBestTimes,
    travelMethods,
    travelInfo: {
      ticketPrice: loc.ticket_price,
      tip: loc.tip,
    },
    experiences: formattedExperiences,
    cuisine: formattedCuisines,
    tips: formattedTips,
    nearby: formattedNearby,
    // averageRating: ratings.averageRating,
    // ratingCount: ratings.ratingCount,
    // comments,
    // userUploads,
    nearbyHotels,
  };
}


/**
 * Lấy tất cả địa điểm với thông tin đầy đủ
 * @returns {Array} - Danh sách địa điểm hoàn chỉnh
 */
async function getAllLocations() {
  const basicLocations = await getBasicLocations();
  const locations = [];
  for (const loc of basicLocations) {
    const location = await composeLocation(loc);
    locations.push(location);
  }
  return locations;
}

/**
 * Lấy thông tin đầy đủ của một địa điểm theo ID
 * @param {Number} locationId - ID của địa điểm
 * @returns {Object|null} - Thông tin đầy đủ của địa điểm
 */
async function getLocationById(locationId) {
  const basicLocation = await getBasicLocationById(locationId);
  return await composeLocation(basicLocation);
}

async function getLocationByName(name) {
  const query = `
      SELECT * FROM Locations WHERE name = ?;
    `;
  const [rows] = await pool.execute(query, [name]);
  return rows[0] || null;
}
// Các hàm mới để hỗ trợ cập nhật từng phần
async function updateBasicInfo(locationId, data) {
  const { name, type, description, latitude, longitude, subtitle } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cập nhật bảng Locations
    await connection.execute(
      `UPDATE Locations SET 
                name = ?, 
                type = ?, 
                description = ?, 
                latitude = ?, 
                longitude = ? 
            WHERE id = ?`,
      [name, type, description, latitude, longitude, locationId]
    );

    // Cập nhật subtitle trong LocationDetails
    await connection.execute(
      `UPDATE LocationDetails SET subtitle = ? WHERE location_id = ?`,
      [subtitle, locationId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateTravelInfo(locationId, data) {
  const {
    introduction,
    why_visit_architecture_title,
    why_visit_architecture_text,
    why_visit_culture,
    ticket_price,
    tip,
  } = data;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cập nhật LocationDetails
    await connection.execute(
      `UPDATE LocationDetails SET 
                introduction = ?, 
                why_visit_architecture_title = ?, 
                why_visit_architecture_text = ?, 
                why_visit_culture = ? 
            WHERE location_id = ?`,
      [
        introduction,
        why_visit_architecture_title,
        why_visit_architecture_text,
        why_visit_culture,
        locationId,
      ]
    );

    // Cập nhật TravelInfo
    await connection.execute(
      `UPDATE TravelInfo SET ticket_price = ?, tip = ? WHERE location_id = ?`,
      [ticket_price, tip, locationId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateBestTimes(locationId, bestTimes) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả BestTimes hiện tại
    await connection.execute(`DELETE FROM BestTimes WHERE location_id = ?`, [
      locationId,
    ]);

    // Thêm BestTimes mới
    for (const time of bestTimes) {
      if (time && time.trim() !== "") {
        await connection.execute(
          `INSERT INTO BestTimes (location_id, time_description) VALUES (?, ?)`,
          [locationId, time]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateTips(locationId, tips) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả Tips hiện tại
    await connection.execute(`DELETE FROM Tips WHERE location_id = ?`, [
      locationId,
    ]);

    // Thêm Tips mới
    for (const tip of tips) {
      if (tip && tip.trim() !== "") {
        await connection.execute(
          `INSERT INTO Tips (location_id, description) VALUES (?, ?)`,
          [locationId, tip]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateNearby(locationId, nearby) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả NearbyLocations hiện tại
    await connection.execute(
      `DELETE FROM NearbyLocations WHERE location_id = ?`,
      [locationId]
    );

    // Thêm NearbyLocations mới
    for (const nearbyName of nearby) {
      if (nearbyName && nearbyName.trim() !== "") {
        // Tìm địa điểm lân cận theo tên
        const [rows] = await connection.execute(
          `SELECT id FROM Locations WHERE name = ?`,
          [nearbyName]
        );

        if (rows.length > 0) {
          const nearbyId = rows[0].id;

          // Thêm vào bảng NearbyLocations
          await connection.execute(
            `INSERT INTO NearbyLocations (location_id, nearby_location_id) VALUES (?, ?)`,
            [locationId, nearbyId]
          );
        }
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateTravelMethods(locationId, travelMethods) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả TravelMethods hiện tại
    await connection.execute(
      `DELETE FROM TravelMethods WHERE location_id = ?`,
      [locationId]
    );

    // Thêm TravelMethods mới
    if (travelMethods.fromTuyHoa && Array.isArray(travelMethods.fromTuyHoa)) {
      for (const method of travelMethods.fromTuyHoa) {
        if (method && method.trim() !== "") {
          await connection.execute(
            `INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, 'fromTuyHoa', ?)`,
            [locationId, method]
          );
        }
      }
    }

    if (
      travelMethods.fromElsewhere &&
      Array.isArray(travelMethods.fromElsewhere)
    ) {
      for (const method of travelMethods.fromElsewhere) {
        if (method && method.trim() !== "") {
          await connection.execute(
            `INSERT INTO TravelMethods (location_id, method_type, description) VALUES (?, 'fromElsewhere', ?)`,
            [locationId, method]
          );
        }
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateExperiences(locationId, experiences) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả Experiences hiện tại
    await connection.execute(`DELETE FROM Experiences WHERE location_id = ?`, [
      locationId,
    ]);

    // Thêm Experiences mới và lưu IDs
    const experienceIds = [];

    for (const exp of experiences) {
      if (exp && exp.text && exp.text.trim() !== "") {
        const [result] = await connection.execute(
          `INSERT INTO Experiences (location_id, description) VALUES (?, ?)`,
          [locationId, exp.text]
        );

        experienceIds.push(result.insertId);
      } else {
        experienceIds.push(null);
      }
    }

    await connection.commit();
    return experienceIds;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateCuisines(locationId, cuisines) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa tất cả Cuisines hiện tại
    await connection.execute(`DELETE FROM Cuisines WHERE location_id = ?`, [
      locationId,
    ]);

    // Thêm Cuisines mới và lưu IDs
    const cuisineIds = [];

    for (const cuisine of cuisines) {
      if (cuisine && cuisine.text && cuisine.text.trim() !== "") {
        const [result] = await connection.execute(
          `INSERT INTO Cuisines (location_id, description) VALUES (?, ?)`,
          [locationId, cuisine.text]
        );

        cuisineIds.push(result.insertId);
      } else {
        cuisineIds.push(null);
      }
    }

    await connection.commit();
    return cuisineIds;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


async function getExperienceId(locationId, index) {
  const offset = Number(index);
  if (isNaN(offset)) {
    throw new Error('Index phải là số');
  }
  
  const query = `SELECT id FROM Experiences WHERE location_id = ? ORDER BY id ASC LIMIT ${offset}, 1`;
  
  const [rows] = await pool.execute(query, [locationId]);
  return rows[0]?.id || null;
}

async function getCuisineId(locationId, index) {
  const offset = Number(index);
  if (isNaN(offset)) {
    throw new Error('Index phải là số');
  }
  
  const query = `SELECT id FROM Cuisines WHERE location_id = ? ORDER BY id ASC LIMIT ${offset}, 1`;
  
  const [rows] = await pool.execute(query, [locationId]);
  return rows[0]?.id || null;
}
async function getImageById(imageId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM Location_Images WHERE id = ?`,
      [imageId]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteImage(imageId) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(`DELETE FROM Location_Images WHERE id = ?`, [
      imageId,
    ]);

    return true;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

async function addNearbyLocation(locationId, nearbyId) {
  const connection = await pool.getConnection();
  try {
    // Kiểm tra xem đã có liên kết này chưa
    const [rows] = await connection.execute(
      `SELECT * FROM NearbyLocations WHERE location_id = ? AND nearby_location_id = ?`,
      [locationId, nearbyId]
    );

    if (rows.length === 0) {
      // Thêm mối quan hệ mới
      await connection.execute(
        `INSERT INTO NearbyLocations (location_id, nearby_location_id) VALUES (?, ?)`,
        [locationId, nearbyId]
      );
    }

    return true;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

async function removeNearbyLocation(locationId, nearbyId) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `DELETE FROM NearbyLocations WHERE location_id = ? AND nearby_location_id = ?`,
      [locationId, nearbyId]
    );

    return true;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

async function getLocationByName(name) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM Locations WHERE name = ?`,
      [name]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
}

const handleFileUpload = async (file, type, locationId) => {
  const uploadDir = path.join(
    __dirname,
    "../uploads/locations",
    locationId.toString()
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${type}-${Date.now()}${path.extname(file.name)}`;
  const filePath = path.join(uploadDir, fileName);

  await file.mv(filePath);
  return `/uploads/locations/${locationId}/${fileName}`;
};

/**
 * Save image to database and filesystem
 * @param {Number} locationId - Location ID
 * @param {String|Object} imageFile - Image file or URL
 * @param {String} imageType - Type of image (introduction, architecture, experience, cuisine)
 * @param {Number|null} referenceId - Reference ID for experiences/cuisines
 */
async function saveImage(locationId, imageFile, imageType, referenceId = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // If imageFile is already a URL string, just save to database
    if (typeof imageFile === "string") {
      await connection.execute(
        `INSERT INTO Location_Images (location_id, image_url, image_type, reference_id)
                 VALUES (?, ?, ?, ?)`,
        [locationId, imageFile, imageType, referenceId]
      );

      await connection.commit();
      return imageFile;
    }

    // If it's a file object, handle file upload
    const fileName = createImageFileName(locationId, imageType, referenceId);
    const imageUrl = `/uploads/locations/${locationId}/${fileName}`;
    const uploadDir = path.join(
      __dirname,
      "../uploads/locations",
      locationId.toString()
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    if (imageFile.mv) {
      await imageFile.mv(path.join(uploadDir, fileName));
    } else {
      // Handle buffer or stream if needed
      fs.writeFileSync(path.join(uploadDir, fileName), imageFile);
    }

    // Delete old image if exists (for main images)
    if (!referenceId) {
      await connection.execute(
        `DELETE FROM Location_Images 
                 WHERE location_id = ? AND image_type = ? AND reference_id IS NULL`,
        [locationId, imageType]
      );
    }

    // Save to database
    await connection.execute(
      `INSERT INTO Location_Images (location_id, image_url, image_type, reference_id)
             VALUES (?, ?, ?, ?)`,
      [locationId, imageUrl, imageType, referenceId]
    );

    await connection.commit();
    return imageUrl;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function to create image filename
function createImageFileName(locationId, type, index = "") {
  switch (type) {
    case "introduction":
      return `${locationId}-intro.jpg`;
    case "architecture":
      return `${locationId}-arch.jpg`;
    case "experience":
      return `${locationId}-exp-${index}.jpg`;
    case "cuisine":
      return `${locationId}-cui-${index}.jpg`;
    default:
      return `${locationId}-${type}-${Date.now()}.jpg`;
  }
}

async function getImage(locationId, imageType, referenceId = null) {
  let query = `
        SELECT image_url 
        FROM Location_Images 
        WHERE location_id = ? AND image_type = ?
    `;
  const params = [locationId, imageType];

  if (referenceId) {
    query += ` AND reference_id = ?`;
    params.push(referenceId);
  } else {
    query += ` AND reference_id IS NULL`;
  }

  query += ` LIMIT 1`;
  const [rows] = await pool.execute(query, params);
  return rows[0]?.image_url || null;
}
async function getLocationsByTypes(types, limit = 10) {
    if (!types || types.length === 0) {
        return [];
    }

    try {
        // Dấu ? trong IN (?) sẽ được thư viện mysql2 tự động mở rộng cho mảng
        const query = `
            SELECT * 
            FROM Locations 
            WHERE type IN (?)
            LIMIT ?
        `;
        
        const [locations] = await pool.query(query, [types, limit]);
        return locations;
    } catch (error) {
        console.error('[Location][getLocationsByTypes] Error:', error);
        throw error;
    }
}

module.exports = {
  createLocation,
  createImageFileName,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  updateBasicInfo,
  updateTravelInfo,
  updateBestTimes,
  updateTips,
  updateNearby,
  updateTravelMethods,
  updateExperiences,
  updateCuisines,
  saveImage,
  getExperienceId,
  getCuisineId,
  getImageById,
  deleteImage,
  addNearbyLocation,
  removeNearbyLocation,
  getLocationByName,
  searchLocations,
  getImage,
  getLocationsByTypes,
};