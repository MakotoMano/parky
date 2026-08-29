export type ParkingLot = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  price_per_hour: string;
  capacity: number;
  image_key: string;
};

export type Reservation = {
  id: string;
  user_name: string;
  user_email: string;
  license_plate: string;
  parking_lot_id: string;
  parking_lot: ParkingLot;
  reservation_date: string;
  arrival_time: string;
  duration_hours: number;
  total_amount: string;
  status: "confirmed" | "cancelled";
  qr_code_data: string;
  created_at: string;
};

export type ReservationPayload = {
  user_name: string;
  user_email: string;
  license_plate: string;
  parking_lot_id: string;
  reservation_date: string;
  arrival_time: string;
  duration_hours: number;
};

