const pool = require("../config/db");

const createUser = async (full_name, email, password, phone, role) => {
    const query = `
        INSERT INTO users (full_name, email, password, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [full_name, email, password, phone, role];

    const result = await pool.query(query, values);

    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0];
};

const getUserById = async (id) => {
    const result = await pool.query(
        "SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1",
        [id]
    );
    return result.rows[0];
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
};