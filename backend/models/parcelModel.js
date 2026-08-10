const pool = require("../config/db");
const crypto = require("crypto");

// Helper: Generate Random 12-digit Numeric Parcel ID
function generate12DigitId() {
  const firstDigit = crypto.randomInt(1, 10).toString();
  const rest = crypto.randomInt(0, 100000000000).toString().padStart(11, '0');
  return firstDigit + rest;
}

// Create Parcel with Smart Dual Pricing support & Secure Pickup OTP & 12-digit ID
const createParcel = async (
  sender_id,
  pickup_address,
  drop_address,
  weight,
  parcel_type,
  pickup_date,
  pickup_lat,
  pickup_lng,
  drop_lat,
  drop_lng,
  price,
  estimated_time,
  delivery_tier = 'saver',
  contact_name = '',
  contact_phone = '',
  preferred_pickup_time = 'ASAP',
  savings_amount = 0.00,
  detour_km = 0.00,
  match_reason = 'Driver route matched'
) => {
  const parcel_id = generate12DigitId();
  const pickup_otp = Math.floor(1000 + Math.random() * 9000).toString();

  const result = await pool.query(
    `INSERT INTO parcels
    (id,sender_id,pickup_address,drop_address,weight,parcel_type,pickup_date,pickup_lat,pickup_lng,drop_lat,drop_lng,price,estimated_time,delivery_tier,contact_name,contact_phone,preferred_pickup_time,savings_amount,detour_km,match_reason,pickup_otp,is_pickup_verified)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,FALSE)
    RETURNING *`,
    [
      parcel_id,
      sender_id,
      pickup_address,
      drop_address,
      weight,
      parcel_type,
      pickup_date,
      pickup_lat,
      pickup_lng,
      drop_lat,
      drop_lng,
      price,
      estimated_time,
      delivery_tier,
      contact_name,
      contact_phone,
      preferred_pickup_time,
      savings_amount,
      detour_km,
      match_reason,
      pickup_otp
    ]
  );

  return result.rows[0];
};

// Get All
const getAllParcels = async () => {
  const result = await pool.query(
    "SELECT * FROM parcels ORDER BY id ASC"
  );

  return result.rows;
};

// Get By ID with Full Driver & OTP info
const getParcelById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, 
            d.id AS driver_id,
            d.full_name AS driver_name,
            d.phone AS driver_phone,
            d.vehicle_type,
            d.vehicle_number,
            a.id AS assignment_id,
            a.assignment_status
     FROM parcels p
     LEFT JOIN assignments a ON p.id = a.parcel_id
     LEFT JOIN drivers d ON a.driver_id = d.id
     WHERE p.id=$1
     ORDER BY a.id DESC LIMIT 1`,
    [id]
  );

  return result.rows[0];
};

// NEW - Edit Parcel
const updateParcel = async (
  id,
  pickup_address,
  drop_address,
  weight,
  parcel_type,
  pickup_date,
  pickup_lat,
  pickup_lng,
  drop_lat,
  drop_lng,
  price,
  estimated_time
) => {
  const result = await pool.query(
    `UPDATE parcels
     SET pickup_address=$1,
         drop_address=$2,
         weight=$3,
         parcel_type=$4,
         pickup_date=$5,
         pickup_lat=$6,
         pickup_lng=$7,
         drop_lat=$8,
         drop_lng=$9,
         price=$10,
         estimated_time=$11
     WHERE id=$12
     RETURNING *`,
    [
      pickup_address,
      drop_address,
      weight,
      parcel_type,
      pickup_date,
      pickup_lat,
      pickup_lng,
      drop_lat,
      drop_lng,
      price,
      estimated_time,
      id,
    ]
  );

  return result.rows[0];
};

// Update Status
const updateParcelStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE parcels
     SET status=$1
     WHERE id=$2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};

// Delete
const deleteParcel = async (id) => {
  const result = await pool.query(
    "DELETE FROM parcels WHERE id=$1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createParcel,
  getAllParcels,
  getParcelById,
  updateParcel,
  updateParcelStatus,
  deleteParcel,
};