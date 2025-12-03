const { pool } = require('../config/db');

class Contact {
    constructor(data) {
        this.name = data.name;
        this.email = data.email;
        this.subject = data.subject;
        this.message = data.message;
    }

    async save() {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
                [this.name, this.email, this.subject, this.message]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    static async getAllMessages() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM contact_messages ORDER BY created_at DESC'
            );
            return rows;
        } finally {
            connection.release();
        }
    }
}

module.exports = Contact;