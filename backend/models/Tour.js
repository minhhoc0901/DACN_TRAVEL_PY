const { pool } = require('../config/db');

// -------------------
// Truy vấn cơ bản
// -------------------

/**
 * Thêm một tour mới vào các bảng Tours và các bảng liên quan
 * @param {Object} data - Dữ liệu tour (destination, image, departure_from, duration, description, highlights, schedule, includes, excludes, notes, locations)
 * @returns {Number} - ID của tour vừa tạo
 */
async function createTour(data) {
  const {
    destination,
    image,
    departure_from,
    duration,
    description,
    highlights,
    schedule,
    includes,
    excludes,
    notes,
    locations, 
    user_id, 
    status = 'pending', 
  } = data;

  // Bắt đầu transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Thêm vào bảng Tours với trường status và user_id
    const tourQuery = `
      INSERT INTO Tours (destination, image, departure_from, duration, description, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const [tourResult] = await connection.execute(tourQuery, [
      destination,
      image || null,
      departure_from,
      duration,
      description,
      user_id || null, // Nếu không có user_id thì để null
      status,
    ]);
    const tourId = tourResult.insertId;

    // Thêm vào bảng Tour_Highlights
    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      const highlightValues = highlights.map(highlight => [tourId, highlight]);
      const highlightQuery = `
        INSERT INTO Tour_Highlights (tour_id, highlight) VALUES ?
      `;
      await connection.query(highlightQuery, [highlightValues]);
    }

    // Thêm vào bảng Tour_Schedule và Schedule_Activities
    if (schedule && Array.isArray(schedule) && schedule.length > 0) {
      for (const sched of schedule) {
        const scheduleQuery = `
          INSERT INTO Tour_Schedule (tour_id, day, title) VALUES (?, ?, ?);
        `;
        const [scheduleResult] = await connection.execute(scheduleQuery, [
          tourId,
          sched.day,
          sched.title,
        ]);
        const scheduleId = scheduleResult.insertId;

        if (sched.activities && Array.isArray(sched.activities) && sched.activities.length > 0) {
          const activityValues = sched.activities.map(activity => [scheduleId, activity]);
          const activityQuery = `
            INSERT INTO Schedule_Activities (schedule_id, activity) VALUES ?
          `;
          await connection.query(activityQuery, [activityValues]);
        }

        // Thêm liên kết với các địa điểm trong lịch trình này
        if (sched.locations && Array.isArray(sched.locations) && sched.locations.length > 0) {
          for (const locationId of sched.locations) {
            const locationQuery = `
              INSERT INTO Tour_Locations (tour_id, location_id, schedule_id) 
              VALUES (?, ?, ?);
            `;
            await connection.execute(locationQuery, [tourId, locationId, scheduleId]);
          }
        }
      }
    }

    // Thêm vào bảng Tour_Includes
    if (includes && Array.isArray(includes) && includes.length > 0) {
      const includeValues = includes.map(include => [tourId, include]);
      const includeQuery = `
        INSERT INTO Tour_Includes (tour_id, description) VALUES ?
      `;
      await connection.query(includeQuery, [includeValues]);
    }

    // Thêm vào bảng Tour_Excludes
    if (excludes && Array.isArray(excludes) && excludes.length > 0) {
      const excludeValues = excludes.map(exclude => [tourId, exclude]);
      const excludeQuery = `
        INSERT INTO Tour_Excludes (tour_id, description) VALUES ?
      `;
      await connection.query(excludeQuery, [excludeValues]);
    }

    // Thêm vào bảng Tour_Notes
    if (notes && Array.isArray(notes) && notes.length > 0) {
      const noteValues = notes.map(note => [tourId, note]);
      const noteQuery = `
        INSERT INTO Tour_Notes (tour_id, description) VALUES ?
      `;
      await connection.query(noteQuery, [noteValues]);
    }

    await connection.commit();
    return tourId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Lấy thông tin cơ bản của tất cả tour
 * @param {Boolean} includeAllStatuses - Có bao gồm tất cả trạng thái hay không
 * @param {Number} userId - ID của người dùng để lấy tour của họ (tùy chọn)
 * @returns {Array} - Danh sách tour với thông tin cơ bản
 */
async function getBasicTours(includeAllStatuses = false, userId = null) {
  let query = `
    SELECT 
      t.id,
      t.destination,
      t.image,
      t.departure_from,
      t.duration,
      t.description,
      COALESCE(t.status, 'pending') as status,
      t.user_id,
      t.created_at,
      t.updated_at,
      u.full_name,
      u.username,
      u.avatar AS user_avatar, 
      (SELECT GROUP_CONCAT(highlight SEPARATOR '||') FROM Tour_Highlights WHERE tour_id = t.id) AS highlights,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Includes WHERE tour_id = t.id) AS includes,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Excludes WHERE tour_id = t.id) AS excludes,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Notes WHERE tour_id = t.id) AS notes
    FROM Tours t
    LEFT JOIN Users u ON t.user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];

  // Lọc theo trạng thái nếu không yêu cầu tất cả
  if (!includeAllStatuses) {
    query += " AND t.status = 'approved'";
  }
  
  // Lọc theo user_id nếu được cung cấp
  if (userId) {
    query += " AND t.user_id = ?";
    params.push(userId);
  }
  
  // Thêm sắp xếp theo thời gian tạo
  query += " ORDER BY t.created_at DESC";

  const [rows] = await pool.execute(query, params);

  return rows.map(row => ({
    ...row,
    status: row.status || 'pending',
    username: row.username || '',
    full_name: row.full_name || '',
    user_avatar: row.user_avatar || null,
    highlights: row.highlights ? row.highlights.split('||') : [],
    includes: row.includes ? row.includes.split('||') : [],
    excludes: row.excludes ? row.excludes.split('||') : [],
    notes: row.notes ? row.notes.split('||') : [],
  }));
}

/**
 * Lấy thông tin cơ bản của một tour theo ID
 * @param {Number} tourId - ID của tour
 * @returns {Object|null} - Thông tin cơ bản của tour hoặc null nếu không tìm thấy
 */
async function getBasicTourById(tourId) {
  const query = `
    SELECT 
      t.id,
      t.destination,
      t.image,
      t.departure_from,
      t.duration,
      t.description,
      t.status,
      t.user_id,
      t.created_at,
      u.full_name,
      u.username, /* Added username field */
      (SELECT GROUP_CONCAT(highlight SEPARATOR '||') FROM Tour_Highlights WHERE tour_id = t.id) AS highlights,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Includes WHERE tour_id = t.id) AS includes,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Excludes WHERE tour_id = t.id) AS excludes,
      (SELECT GROUP_CONCAT(description SEPARATOR '||') FROM Tour_Notes WHERE tour_id = t.id) AS notes
    FROM Tours t
    LEFT JOIN Users u ON t.user_id = u.id
    WHERE t.id = ?;
  `;
  const [rows] = await pool.execute(query, [tourId]);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    highlights: row.highlights ? row.highlights.split('||') : [],
    includes: row.includes ? row.includes.split('||') : [],
    excludes: row.excludes ? row.excludes.split('||') : [],
    notes: row.notes ? row.notes.split('||') : [],
  };
}

/**
 * Lấy lịch trình chi tiết của một tour kèm thông tin địa điểm
 * @param {Number} tourId - ID của tour
 * @returns {Array} - Danh sách lịch trình với các hoạt động và địa điểm
 */
async function getSchedule(tourId) {
  // Lấy lịch trình cơ bản
  const scheduleQuery = `
    SELECT 
      ts.id, 
      ts.day, 
      ts.title, 
      (SELECT GROUP_CONCAT(activity SEPARATOR '||') 
       FROM Schedule_Activities 
       WHERE schedule_id = ts.id) AS activities
    FROM Tour_Schedule ts
    WHERE ts.tour_id = ?
    ORDER BY ts.day;
  `;
  const [scheduleRows] = await pool.execute(scheduleQuery, [tourId]);
  
  // Lấy thông tin địa điểm cho mỗi lịch trình
  const schedules = [];
  for (const sched of scheduleRows) {
    const locationQuery = `
      SELECT 
        l.id, 
        l.name, 
        l.type,
        l.description,
        l.latitude,
        l.longitude
      FROM Locations l
      JOIN Tour_Locations tl ON l.id = tl.location_id
      WHERE tl.tour_id = ? AND tl.schedule_id = ?;
    `;
    const [locationRows] = await pool.execute(locationQuery, [tourId, sched.id]);
    
    schedules.push({
      id: sched.id,
      day: sched.day,
      title: sched.title,
      activities: sched.activities ? sched.activities.split('||') : [],
      locations: locationRows || []
    });
  }
  
  return schedules;
}

/**
 * Cập nhật thông tin một tour
 * @param {Number} tourId - ID của tour
 * @param {Object} data - Dữ liệu cần cập nhật
 * @returns {Boolean} - True nếu cập nhật thành công
 */
async function updateTour(tourId, data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update basic tour info
    let tourQuery = `
      UPDATE Tours 
      SET destination = ?, image = ?, departure_from = ?, duration = ?, description = ?
    `;
    
    let params = [
      data.destination,
      data.image || null,
      data.departure_from,
      data.duration,
      data.description
    ];
    
    // Cập nhật status nếu được cung cấp
    if (data.status) {
      tourQuery += ", status = ?";
      params.push(data.status);
    }
    
    tourQuery += " WHERE id = ?";
    params.push(tourId);
    
    await connection.execute(tourQuery, params);

    // Update related data with proper error handling
    await updateTourHighlights(connection, tourId, data.highlights);
    await updateTourSchedule(connection, tourId, data.schedule);
    await updateTourIncludes(connection, tourId, data.includes);
    await updateTourExcludes(connection, tourId, data.excludes);
    await updateTourNotes(connection, tourId, data.notes);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cập nhật trạng thái của tour
 * @param {Number} tourId - ID của tour
 * @param {String} status - Trạng thái mới ('pending', 'approved', 'rejected')
 * @returns {Boolean} - True nếu cập nhật thành công
 */
async function updateTourStatus(tourId, status) {
  try {
    // Kiểm tra trạng thái hợp lệ
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ. Phải là "pending", "approved", hoặc "rejected"');
    }
    
    const query = `
      UPDATE Tours
      SET status = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(query, [status, tourId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái tour:', error);
    throw error;
  }
}

/**
 * Cập nhật highlights của tour
 * @param {Object} connection - Kết nối MySQL
 * @param {Number} tourId - ID của tour
 * @param {Array} highlights - Danh sách highlights mới
 */
async function updateTourHighlights(connection, tourId, highlights) {
  // Xóa highlights cũ
  await connection.execute('DELETE FROM Tour_Highlights WHERE tour_id = ?', [tourId]);
  
  // Thêm highlights mới
  if (highlights && Array.isArray(highlights) && highlights.length > 0) {
    const filteredHighlights = highlights.filter(h => h && h.trim());
    if (filteredHighlights.length > 0) {
      const highlightValues = filteredHighlights.map(highlight => [tourId, highlight]);
      const highlightQuery = `
        INSERT INTO Tour_Highlights (tour_id, highlight) VALUES ?
      `;
      await connection.query(highlightQuery, [highlightValues]);
    }
  }
}

/**
 * Cập nhật schedule của tour
 * @param {Object} connection - Kết nối MySQL
 * @param {Number} tourId - ID của tour
 * @param {Array} schedule - Lịch trình mới
 */
async function updateTourSchedule(connection, tourId, schedule) {
  // Lấy danh sách schedule cũ để xóa
  const [schedules] = await connection.execute(
    'SELECT id FROM Tour_Schedule WHERE tour_id = ?', 
    [tourId]
  );
  
  // Xóa các bản ghi liên quan đến schedule
  for (const sched of schedules) {
    await connection.execute('DELETE FROM Schedule_Activities WHERE schedule_id = ?', [sched.id]);
    await connection.execute('DELETE FROM Tour_Locations WHERE schedule_id = ?', [sched.id]);
  }
  
  // Xóa schedule cũ
  await connection.execute('DELETE FROM Tour_Schedule WHERE tour_id = ?', [tourId]);
  
  // Thêm schedule mới
  if (schedule && Array.isArray(schedule) && schedule.length > 0) {
    for (const sched of schedule) {
      if (!sched.day || !sched.title) continue;
      
      const scheduleQuery = `
        INSERT INTO Tour_Schedule (tour_id, day, title) VALUES (?, ?, ?);
      `;
      const [scheduleResult] = await connection.execute(scheduleQuery, [
        tourId,
        sched.day,
        sched.title,
      ]);
      const scheduleId = scheduleResult.insertId;
      
      // Thêm activities nếu có
      if (sched.activities && Array.isArray(sched.activities) && sched.activities.length > 0) {
        const filteredActivities = sched.activities.filter(a => a && a.trim());
        if (filteredActivities.length > 0) {
          const activityValues = filteredActivities.map(activity => [scheduleId, activity]);
          const activityQuery = `
            INSERT INTO Schedule_Activities (schedule_id, activity) VALUES ?
          `;
          await connection.query(activityQuery, [activityValues]);
        }
      }
      
      // Thêm locations nếu có
      if (sched.locations && Array.isArray(sched.locations) && sched.locations.length > 0) {
        for (const locationId of sched.locations) {
          const locationQuery = `
            INSERT INTO Tour_Locations (tour_id, location_id, schedule_id) 
            VALUES (?, ?, ?);
          `;
          await connection.execute(locationQuery, [tourId, locationId, scheduleId]);
        }
      }
    }
  }
}

/**
 * Cập nhật includes của tour
 * @param {Object} connection - Kết nối MySQL
 * @param {Number} tourId - ID của tour
 * @param {Array} includes - Danh sách includes mới
 */
async function updateTourIncludes(connection, tourId, includes) {
  await connection.execute('DELETE FROM Tour_Includes WHERE tour_id = ?', [tourId]);
  
  if (includes && Array.isArray(includes) && includes.length > 0) {
    const filteredIncludes = includes.filter(i => i && i.trim());
    if (filteredIncludes.length > 0) {
      const includeValues = filteredIncludes.map(include => [tourId, include]);
      const includeQuery = `
        INSERT INTO Tour_Includes (tour_id, description) VALUES ?
      `;
      await connection.query(includeQuery, [includeValues]);
    }
  }
}

/**
 * Cập nhật excludes của tour
 * @param {Object} connection - Kết nối MySQL
 * @param {Number} tourId - ID của tour
 * @param {Array} excludes - Danh sách excludes mới
 */
async function updateTourExcludes(connection, tourId, excludes) {
  await connection.execute('DELETE FROM Tour_Excludes WHERE tour_id = ?', [tourId]);
  
  if (excludes && Array.isArray(excludes) && excludes.length > 0) {
    const filteredExcludes = excludes.filter(e => e && e.trim());
    if (filteredExcludes.length > 0) {
      const excludeValues = filteredExcludes.map(exclude => [tourId, exclude]);
      const excludeQuery = `
        INSERT INTO Tour_Excludes (tour_id, description) VALUES ?
      `;
      await connection.query(excludeQuery, [excludeValues]);
    }
  }
}

/**
 * Cập nhật notes của tour
 * @param {Object} connection - Kết nối MySQL
 * @param {Number} tourId - ID của tour
 * @param {Array} notes - Danh sách notes mới
 */
async function updateTourNotes(connection, tourId, notes) {
  await connection.execute('DELETE FROM Tour_Notes WHERE tour_id = ?', [tourId]);
  
  if (notes && Array.isArray(notes) && notes.length > 0) {
    const filteredNotes = notes.filter(n => n && n.trim());
    if (filteredNotes.length > 0) {
      const noteValues = filteredNotes.map(note => [tourId, note]);
      const noteQuery = `
        INSERT INTO Tour_Notes (tour_id, description) VALUES ?
      `;
      await connection.query(noteQuery, [noteValues]);
    }
  }
}

/**
 * Xóa một tour và tất cả dữ liệu liên quan
 * @param {Number} tourId - ID của tour
 * @returns {Boolean} - True nếu xóa thành công
 */
async function deleteTour(tourId) {
  // Bắt đầu transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Xóa dữ liệu liên quan trước
    await connection.execute('DELETE FROM Tour_Highlights WHERE tour_id = ?', [tourId]);
    await connection.execute('DELETE FROM Tour_Locations WHERE tour_id = ?', [tourId]);
    await connection.execute(
      'DELETE FROM Schedule_Activities WHERE schedule_id IN (SELECT id FROM Tour_Schedule WHERE tour_id = ?)', 
      [tourId]
    );
    await connection.execute('DELETE FROM Tour_Schedule WHERE tour_id = ?', [tourId]);
    await connection.execute('DELETE FROM Tour_Includes WHERE tour_id = ?', [tourId]);
    await connection.execute('DELETE FROM Tour_Excludes WHERE tour_id = ?', [tourId]);
    await connection.execute('DELETE FROM Tour_Notes WHERE tour_id = ?', [tourId]);
    await connection.execute('DELETE FROM Reviews WHERE tour_id = ?', [tourId]);

    // Xóa tour từ bảng Tours
    const [result] = await connection.execute('DELETE FROM Tours WHERE id = ?', [tourId]);
    
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Tìm các tour theo địa điểm
 * @param {Number} locationId - ID của địa điểm
 * @param {Boolean} approvedOnly - Chỉ lấy các tour đã được duyệt
 * @returns {Array} - Danh sách các tour có chứa địa điểm này
 */
async function getToursByLocation(locationId, approvedOnly = true) {
  let query = `
    SELECT DISTINCT t.*
    FROM Tours t
    JOIN Tour_Locations tl ON t.id = tl.tour_id
    WHERE tl.location_id = ?
  `;
  
  const params = [locationId];
  
  if (approvedOnly) {
    query += " AND t.status = 'approved'";
  }
  
  const [rows] = await pool.execute(query, params);
  const tours = [];
  
  for (const tour of rows) {
    const fullTour = await composeTour({ id: tour.id });
    tours.push(fullTour);
  }
  
  return tours;
}

/**
 * Lấy danh sách tour theo trạng thái
 * @param {String} status - Trạng thái cần lọc ('pending', 'approved', 'rejected')
 * @returns {Array} - Danh sách tour theo trạng thái
 */
async function getToursByStatus(status) {
  try {
    const query = `
      SELECT *
      FROM Tours
      WHERE status = ?
      ORDER BY created_at DESC
    `;
    
    const [rows] = await pool.execute(query, [status]);
    const tours = [];
    
    for (const tour of rows) {
      const fullTour = await composeTour({ id: tour.id });
      tours.push(fullTour);
    }
    
    return tours;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tour theo trạng thái:', error);
    throw error;
  }
}

/**
 * Lấy danh sách tour của một người dùng
 * @param {Number} userId - ID của người dùng
 * @returns {Array} - Danh sách tour của người dùng
 */
async function getToursByUser(userId) {
  try {
    const basicTours = await getBasicTours(true, userId);
    const tours = [];
    
    for (const tour of basicTours) {
      const fullTour = await composeTour(tour);
      tours.push(fullTour);
    }
    
    return tours;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tour của người dùng:', error);
    throw error;
  }
}

// -------------------
// Hợp nhất dữ liệu
// -------------------

/**
 * Hợp nhất dữ liệu từ các bảng để tạo đối tượng tour hoàn chỉnh
 * @param {Object} tour - Thông tin cơ bản của tour
 * @returns {Object|null} - Đối tượng tour hoàn chỉnh
 */
async function composeTour(tour) {
  if (!tour) return null;

  // Lấy lịch trình với thông tin địa điểm
  const schedule = await getSchedule(tour.id);

  // Lấy tất cả các địa điểm trong tour
  const locationQuery = `
    SELECT DISTINCT 
      l.id, 
      l.name, 
      l.type, 
      l.description,
      l.latitude,
      l.longitude
    FROM Locations l
    JOIN Tour_Locations tl ON l.id = tl.location_id
    WHERE tl.tour_id = ?;
  `;
  const [locations] = await pool.execute(locationQuery, [tour.id]);

  return {
    id: tour.id,
    destination: tour.destination,
    image: tour.image,
    departure_from: tour.departure_from,
    duration: tour.duration,
    description: tour.description,
    status: tour.status,
    user_id: tour.user_id,
    username: tour.username,
    full_name: tour.full_name,
    user_avatar: tour.user_avatar, 
    updated_at: tour.updated_at,
    created_at: tour.created_at,
    highlights: tour.highlights,
    schedule,
    includes: tour.includes,
    excludes: tour.excludes,
    notes: tour.notes,
    locations
  };
}

/**
 * Lấy tất cả tour với thông tin đầy đủ
 * @param {Boolean} approvedOnly - Chỉ lấy các tour đã được duyệt
 * @returns {Array} - Danh sách tour hoàn chỉnh
 */
async function getAllTours(approvedOnly = true) {
  const basicTours = await getBasicTours(!approvedOnly);
  const tours = [];
  for (const tour of basicTours) {
    const fullTour = await composeTour(tour);
    tours.push(fullTour);
  }
  return tours;
}

/**
 * Lấy thông tin đầy đủ của một tour theo ID
 * @param {Number} tourId - ID của tour
 * @returns {Object|null} - Thông tin đầy đủ của tour
 */
async function getTourById(tourId) {
  const basicTour = await getBasicTourById(tourId);
  return await composeTour(basicTour);
}

// 🔹 Tìm kiếm tour theo từ khóa (destination, description)
  async function searchTours(keyword) {
  const q = `%${keyword}%`;
  
  // Truy vấn chỉ để tìm kiếm và JOIN lấy thông tin user
  const [rows] = await pool.execute(
    `
    SELECT 
      t.*, 
      u.full_name, 
      u.avatar as user_avatar
    FROM 
      Tours t
    LEFT JOIN 
      Users u ON t.user_id = u.id
    WHERE 
      t.destination LIKE ? OR 
      t.description LIKE ? OR 
      t.departure_from LIKE ?
    ORDER BY 
      t.updated_at DESC
    `,
    [q, q, q]
  );
  
  return rows;
}

// -------------------20/10/2025 update thêm lọc tour bán

/**
 * Lấy danh sách tours đã được duyệt để bán
 */

async function getApprovedToursForSale(options = {}) {
    try {
        const { 
            page = 1, 
            limit = 12, 
            destination, 
            price_min, 
            price_max, 
            duration, 
            sort_by = 'latest' 
        } = options;
        
        const offset = (page - 1) * limit;
        
        // Build WHERE clause
        let whereConditions = ["t.status = 'approved'", "u.role = 'admin'"]; // Thêm điều kiện lọc theo role
        let params = [];
        
        if (destination) {
            whereConditions.push('t.destination LIKE ?');
            params.push(`%${destination}%`);
        }
        
        if (duration) {
            whereConditions.push('t.duration LIKE ?');
            params.push(`%${duration}%`);
        }
        
        // Price filter sẽ được áp dụng sau khi JOIN với Tour_Prices
        let priceFilter = '';
        if (price_min || price_max) {
            if (price_min && price_max) {
                priceFilter = 'HAVING min_price >= ? AND min_price <= ?';
                params.push(price_min, price_max);
            } else if (price_min) {
                priceFilter = 'HAVING min_price >= ?';
                params.push(price_min);
            } else if (price_max) {
                priceFilter = 'HAVING min_price <= ?';
                params.push(price_max);
            }
        }
        
        // Build ORDER BY clause
        let orderBy = '';
        switch (sort_by) {
            case 'price_low':
                orderBy = 'ORDER BY min_price ASC';
                break;
            case 'price_high':
                orderBy = 'ORDER BY min_price DESC';
                break;
            case 'rating':
                orderBy = 'ORDER BY avg_rating DESC, review_count DESC';
                break;
            case 'popular':
                orderBy = 'ORDER BY review_count DESC, avg_rating DESC';
                break;
            case 'latest':
            default:
                orderBy = 'ORDER BY latest_update DESC';
                break;
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Main query - sửa lại cho đúng với schema
        const query = `
            SELECT 
                t.id,
                t.destination as title,  -- Sử dụng destination làm title
                t.destination,
                t.departure_from,
                t.duration,
                t.description,
                t.image,
                t.created_at,
                t.updated_at,
                GREATEST(t.created_at, IFNULL(t.updated_at, t.created_at)) as latest_update,
                
                -- Price information từ Tour_Prices
                COALESCE(MIN(CASE 
                    WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 
                    THEN tp.sale_price 
                    ELSE tp.price 
                END), 0) as min_price,
                
                COALESCE(MAX(CASE 
                    WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 
                    THEN tp.sale_price 
                    ELSE tp.price 
                END), 0) as max_price,
                
                -- Check if has sale price
                COUNT(CASE WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 THEN 1 END) > 0 as has_sale,
                
                -- Review statistics từ Reviews
                COALESCE(r.avg_rating, 0) as avg_rating,
                COALESCE(r.review_count, 0) as review_count,
                
                -- User info
                u.full_name as creator_name,
                u.username as creator_username
                
            FROM Tours t
            LEFT JOIN Tour_Prices tp ON t.id = tp.tour_id
            LEFT JOIN (
                SELECT 
                    tour_id,
                    AVG(rating) as avg_rating,
                    COUNT(*) as review_count
                FROM Reviews 
                GROUP BY tour_id
            ) r ON t.id = r.tour_id
            LEFT JOIN Users u ON t.user_id = u.id
            WHERE ${whereClause}
            GROUP BY t.id
            ${priceFilter}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        
        const [tours] = await pool.query(query, params);
        
        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM Tours t
            LEFT JOIN Users u ON t.user_id = u.id
            WHERE ${whereClause}
        `;
        
        const countParams = params.slice(0, -2); // Remove limit and offset
        const [countResult] = await pool.query(countQuery, countParams);
        
        return {
            tours: tours.map(tour => ({
                ...tour,
                avg_rating: parseFloat(tour.avg_rating),
                min_price: parseFloat(tour.min_price),
                max_price: parseFloat(tour.max_price),
                has_promotion: false // Tạm thời false vì chưa có bảng promotion_tours
            })),
            total: countResult[0].total
        };
        
    } catch (error) {
        console.error('[Tour][getApprovedToursForSale] Error:', error);
        throw error;
    }
}
/**
 * Lấy chi tiết tour để hiển thị cho khách hàng
 */
async function getTourDetailForSale(tourId) {
    try {
        const query = `
            SELECT 
                t.*,
                GREATEST(t.created_at, IFNULL(t.updated_at, t.created_at)) as latest_update,
                
                -- Review statistics
                COALESCE(r.avg_rating, 0) as avg_rating,
                COALESCE(r.review_count, 0) as review_count,
                
                -- Creator info
                u.full_name as creator_name,
                u.username as creator_username,
                u.email as creator_email
                
            FROM Tours t
            LEFT JOIN (
                SELECT 
                    tour_id,
                    AVG(rating) as avg_rating,
                    COUNT(*) as review_count
                FROM Reviews 
                GROUP BY tour_id
            ) r ON t.id = r.tour_id
            LEFT JOIN Users u ON t.user_id = u.id
            WHERE t.id = ? AND t.status = 'approved' AND u.role = 'admin'
        `;
        
        const [tours] = await pool.query(query, [tourId]);
        
        if (!tours.length) return null;
        
        const tour = tours[0];
        
        // Chỉ lấy prices - bỏ phần additionalData
        const prices = await getTourPrices(tourId);
        
        return {
            ...tour,
            avg_rating: parseFloat(tour.avg_rating),
            prices
        };
        
    } catch (error) {
        console.error('[Tour][getTourDetailForSale] Error:', error);
        throw error;
    }
}

/**
 * Lấy giá tour từ Tour_Prices
 */
async function getTourPrices(tourId) {
    try {
        const [prices] = await pool.query(`
            SELECT 
                id,
                price_type,
                price,
                sale_price,
                CASE 
                    WHEN sale_price IS NOT NULL AND sale_price > 0 
                    THEN sale_price 
                    ELSE price 
                END as final_price,
                CASE 
                    WHEN sale_price IS NOT NULL AND sale_price > 0 
                    THEN ROUND(((price - sale_price) / price) * 100)
                    ELSE 0 
                END as discount_percent
            FROM Tour_Prices 
            WHERE tour_id = ?
            ORDER BY price ASC
        `, [tourId]);
        
        return prices.map(price => ({
            ...price,
            price: parseFloat(price.price),
            sale_price: price.sale_price ? parseFloat(price.sale_price) : null,
            final_price: parseFloat(price.final_price),
            discount_percent: parseInt(price.discount_percent)
        }));
        
    } catch (error) {
        console.error('[Tour][getTourPrices] Error:', error);
        throw error;
    }
}


/**
 * Lấy tours nổi bật (rating cao, nhiều review)
 */
async function getFeaturedTours(limit = 8) {
    try {
        const query = `
            SELECT 
                t.id,
                t.destination as title,
                t.destination,
                t.departure_from,
                t.duration,
                t.image,
                GREATEST(t.created_at, IFNULL(t.updated_at, t.created_at)) as latest_update,
                
                -- Price information
                COALESCE(MIN(CASE 
                    WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 
                    THEN tp.sale_price 
                    ELSE tp.price 
                END), 0) as min_price,
                
                -- Review statistics
                COALESCE(r.avg_rating, 0) as avg_rating,
                COALESCE(r.review_count, 0) as review_count
                
            FROM Tours t
            JOIN Users u ON t.user_id = u.id 
            LEFT JOIN Tour_Prices tp ON t.id = tp.tour_id
            LEFT JOIN (
                SELECT 
                    tour_id,
                    AVG(rating) as avg_rating,
                    COUNT(*) as review_count
                FROM Reviews 
                GROUP BY tour_id
            ) r ON t.id = r.tour_id
            WHERE t.status = 'approved' AND u.role = 'admin'
            GROUP BY t.id
            HAVING avg_rating >= 4.0 OR review_count >= 5
            ORDER BY (avg_rating * 0.7 + (review_count / 10) * 0.3) DESC
            LIMIT ?
        `;
        
        const [tours] = await pool.query(query, [limit]);
        
        return tours.map(tour => ({
            ...tour,
            avg_rating: parseFloat(tour.avg_rating),
            min_price: parseFloat(tour.min_price)
        }));
        
    } catch (error) {
        console.error('[Tour][getFeaturedTours] Error:', error);
        throw error;
    }
}
/**
 * Lấy danh sách tour dựa trên một danh sách các ID địa điểm
 * @param {Array<number>} locationIds - Mảng các ID của địa điểm
 * @param {number} limit - Số lượng tour tối đa cần lấy
 * @returns {Promise<Array>} - Danh sách các tour tìm thấy
 */
async function getToursByLocationIds(locationIds, limit = 5) {
    if (!locationIds || locationIds.length === 0) {
        console.log('[Tour][getToursByLocationIds] No location IDs provided');
        return [];
    }

    try {
        // Validate và clean location IDs
        const validLocationIds = locationIds
            .filter(id => id != null && !isNaN(id))
            .map(id => parseInt(id));

        if (validLocationIds.length === 0) {
            console.log('[Tour][getToursByLocationIds] No valid location IDs');
            return [];
        }

        const placeholders = validLocationIds.map(() => '?').join(',');
        
        const query = `
            SELECT 
                t.id,
                t.destination as title,
                t.destination,
                t.departure_from,
                t.duration,
                t.description,
                t.image,
                t.created_at,
                t.updated_at,
                GREATEST(t.created_at, IFNULL(t.updated_at, t.created_at)) as latest_update,
                
                -- Price information từ Tour_Prices
                COALESCE(MIN(CASE 
                    WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 
                    THEN tp.sale_price 
                    ELSE tp.price 
                END), 0) as min_price,
                
                COALESCE(MAX(CASE 
                    WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 
                    THEN tp.sale_price 
                    ELSE tp.price 
                END), 0) as max_price,
                
                -- Check if has sale
                COUNT(CASE WHEN tp.sale_price IS NOT NULL AND tp.sale_price > 0 THEN 1 END) > 0 as has_sale,
                
                -- Review statistics
                COALESCE(r.avg_rating, 0) as avg_rating,
                COALESCE(r.review_count, 0) as review_count,
                
                -- User info
                u.full_name as creator_name,
                u.username as creator_username
                
            FROM Tours t
            INNER JOIN Tour_Locations tl ON t.id = tl.tour_id
            LEFT JOIN Tour_Prices tp ON t.id = tp.tour_id
            LEFT JOIN (
                SELECT 
                    tour_id,
                    AVG(rating) as avg_rating,
                    COUNT(*) as review_count
                FROM Reviews 
                GROUP BY tour_id
            ) r ON t.id = r.tour_id
            LEFT JOIN Users u ON t.user_id = u.id
            WHERE tl.location_id IN (${placeholders})
              AND t.status = 'approved'
              AND u.role = 'admin'
            GROUP BY t.id, t.destination, t.description, t.image, t.departure_from, 
                     t.duration, t.created_at, t.updated_at, u.full_name, u.username
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT ?
        `;

        console.log('[Tour][getToursByLocationIds] Location IDs:', validLocationIds);
        console.log('[Tour][getToursByLocationIds] Limit:', limit);
        
        const params = [...validLocationIds, parseInt(limit)];
        const [tours] = await pool.query(query, params);
        
        console.log('[Tour][getToursByLocationIds] Found tours:', tours.length);
        
        // Format giống hệt getApprovedToursForSale
        return tours.map(tour => ({
            id: tour.id,
            title: tour.title,
            destination: tour.destination,
            departure_from: tour.departure_from,
            duration: tour.duration,
            description: tour.description,
            image: tour.image,
            created_at: tour.created_at,
            updated_at: tour.updated_at,
            latest_update: tour.latest_update,
            min_price: parseFloat(tour.min_price || 0),
            max_price: parseFloat(tour.max_price || 0),
            has_sale: tour.has_sale ? 1 : 0,
            avg_rating: parseFloat(tour.avg_rating || 0),
            review_count: parseInt(tour.review_count || 0),
            creator_name: tour.creator_name || 'Không rõ',
            creator_username: tour.creator_username,
            has_promotion: false // Giống như getApprovedToursForSale
        }));

    } catch (error) {
        console.error('[Tour][getToursByLocationIds] Error:', error);
        console.error('[Tour][getToursByLocationIds] Stack:', error.stack);
        throw error;
    }
}


module.exports = { 
  createTour, 
  getAllTours, 
  getTourById, 
  updateTour, 
  deleteTour,
  getToursByLocation,
  updateTourStatus,
  getToursByStatus,
  getToursByUser,
  searchTours,
  getApprovedToursForSale,
  getTourDetailForSale,
  getTourPrices,
  getFeaturedTours,
  getToursByLocationIds
};