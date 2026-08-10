const pool = require("../config/db");

// Check Existing Driver by Email, Phone, License, or Vehicle Number
const checkExistingDriver = async (
    email,
    phone,
    license_number,
    vehicle_number,
    excludeId = null
) => {
    let query = `
        SELECT * FROM drivers 
        WHERE (
            LOWER(TRIM(email)) = LOWER(TRIM($1))
            OR REPLACE(REPLACE(phone, ' ', ''), '-', '') = REPLACE(REPLACE($2, ' ', ''), '-', '')
            OR UPPER(REPLACE(REPLACE(license_number, ' ', ''), '-', '')) = UPPER(REPLACE(REPLACE($3, ' ', ''), '-', ''))
            OR UPPER(REPLACE(REPLACE(vehicle_number, ' ', ''), '-', '')) = UPPER(REPLACE(REPLACE($4, ' ', ''), '-', ''))
        )
    `;
    const params = [email || '', phone || '', license_number || '', vehicle_number || ''];
    if (excludeId) {
        query += ` AND id != $5`;
        params.push(excludeId);
    }
    const result = await pool.query(query, params);
    return result.rows;
};

// Create Driver
const createDriver = async (
    full_name,
    email,
    phone,
    license_number,
    vehicle_type,
    vehicle_number
) => {

    const result = await pool.query(
        `INSERT INTO drivers
        (full_name, email, phone, license_number, vehicle_type, vehicle_number)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number
        ]
    );

    return result.rows[0];
};

// Get All Drivers
const getAllDrivers = async () => {

    const result = await pool.query(
        "SELECT * FROM drivers ORDER BY id"
    );

    return result.rows;
};

// Get Driver By ID
const getDriverById = async (id) => {

    const result = await pool.query(
        "SELECT * FROM drivers WHERE id = $1",
        [id]
    );

    return result.rows[0];
};

// Update Driver
const updateDriver = async (
    id,
    full_name,
    email,
    phone,
    license_number,
    vehicle_type,
    vehicle_number,
    status
) => {

    const result = await pool.query(
        `UPDATE drivers
        SET
            full_name = $1,
            email = $2,
            phone = $3,
            license_number = $4,
            vehicle_type = $5,
            vehicle_number = $6,
            status = $7
        WHERE id = $8
        RETURNING *`,
        [
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number,
            status,
            id
        ]
    );

    return result.rows[0];
};

// Delete Driver
const deleteDriver = async (id) => {

    const result = await pool.query(
        "DELETE FROM drivers WHERE id = $1 RETURNING *",
        [id]
    );

    return result.rows[0];
};

module.exports = {
    checkExistingDriver,
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver
};