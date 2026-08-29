CREATE TABLE IF NOT EXISTS parking_lots (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(220) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    image_key VARCHAR(40) NOT NULL DEFAULT 'city',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(36) PRIMARY KEY,
    user_name VARCHAR(120) NOT NULL,
    user_email VARCHAR(180) NOT NULL,
    license_plate VARCHAR(10) NOT NULL,
    parking_lot_id VARCHAR(36) NOT NULL REFERENCES parking_lots(id),
    reservation_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL CHECK (duration_hours BETWEEN 1 AND 12),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    qr_code_data VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_reservations_user_email ON reservations(user_email);
CREATE INDEX IF NOT EXISTS ix_reservations_lot_date ON reservations(parking_lot_id, reservation_date);

