const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function createReview(data) {
    const { tour_id, user_id, rating, comment, imageUrls = [] } = data;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reviewResult] = await connection.execute(
            'INSERT INTO Reviews (tour_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
            [tour_id, user_id, rating, comment]
        );
        const reviewId = reviewResult.insertId;

        if (imageUrls && imageUrls.length > 0) {
            const imageValues = imageUrls.map(url => [reviewId, url]);
            await connection.query(
                'INSERT INTO Review_Images (review_id, image_url) VALUES ?',
                [imageValues]
            );
        }

        await connection.commit();
        // Fetch the created review with user info and images to return it
        const newReview = await getReviewById(reviewId, connection);
        return newReview;
    } catch (error) {
        await connection.rollback();
        // Attempt to delete uploaded files if DB operation fails
        imageUrls.forEach(url => {
            const imagePath = path.join(__dirname, '..', url);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, err => {
                    if (err) console.error("Error deleting uploaded review image after DB error:", imagePath, err);
                });
            }
        });
        throw error;
    } finally {
        connection.release();
    }
}

async function getReviewById(reviewId, dbConnection = pool) {
    const [reviewRows] = await dbConnection.execute(`
        SELECT r.id, r.tour_id, r.user_id, r.rating, r.comment, r.created_at, 
               u.username, u.avatar as user_avatar 
        FROM Reviews r
        JOIN Users u ON r.user_id = u.id
        WHERE r.id = ?
    `, [reviewId]);

    if (reviewRows.length === 0) return null;
    const review = reviewRows[0];

    const [imageRows] = await dbConnection.execute('SELECT image_url FROM Review_Images WHERE review_id = ?', [reviewId]);
    review.images = imageRows.map(img => img.image_url);
    return review;
}

async function getReviewsByTourId(tourId) {
    const connection = await pool.getConnection();
    try {
        const [reviews] = await connection.execute(`
            SELECT r.id, r.rating, r.comment, r.created_at, 
                   u.id as user_id, u.username, u.avatar as user_avatar
            FROM Reviews r
            JOIN Users u ON r.user_id = u.id
            WHERE r.tour_id = ?
            ORDER BY r.created_at DESC
        `, [tourId]);

        for (let review of reviews) {
            const [images] = await connection.execute(
                'SELECT id, image_url FROM Review_Images WHERE review_id = ?',
                [review.id]
            );
            review.images = images.map(img => img.image_url);
        }
        return reviews;
    } finally {
        connection.release();
    }
}

async function getReviewStatsByTourId(tourId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT 
        COUNT(id) AS total_reviews,
        IFNULL(AVG(rating), 0) AS average_rating
      FROM Reviews
      WHERE tour_id = ?
      `,
      [tourId]
    );

    const { total_reviews, average_rating } = rows[0];

    // -- DÒNG CODE ĐƯỢC SỬA Ở ĐÂY --
    // 1. Chuyển average_rating (string) thành number
    const avgAsNumber = parseFloat(average_rating);
    // 2. Bây giờ mới gọi .toFixed() trên number đó, rồi chuyển lại thành number
    const roundedAverage = parseFloat(avgAsNumber.toFixed(1));

    return {
      count: total_reviews,
      average: roundedAverage,
    };
  } catch (error) {
    console.error("❌ Lỗi tại getReviewStatsByTourId:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createReview, getReviewsByTourId, getReviewById, getReviewStatsByTourId };