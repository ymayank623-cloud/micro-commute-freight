const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'micro_commute',
    password: 'Mayank8492',
    port: 5432,
});

const createNotificationsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            is_read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(query);
        console.log("✅ Notifications table created successfully.");
    } catch (err) {
        console.error("❌ Error creating notifications table:", err);
    } finally {
        pool.end();
    }
};

createNotificationsTable();
