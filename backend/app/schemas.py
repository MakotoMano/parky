from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ParkingLotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    address: str
    neighborhood: str
    price_per_hour: Decimal
    capacity: int
    image_key: str


class ReservationCreate(BaseModel):
    user_name: str = Field(min_length=2, max_length=120)
    user_email: EmailStr
    license_plate: str = Field(min_length=7, max_length=8)
    parking_lot_id: str
    reservation_date: date
    arrival_time: time
    duration_hours: int = Field(ge=1, le=12)

    @field_validator("user_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("user_email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("license_plate")
    @classmethod
    def normalize_plate(cls, value: str) -> str:
        normalized = value.upper().replace("-", "").replace(" ", "")
        if len(normalized) != 7 or not normalized.isalnum():
            raise ValueError("Informe uma placa válida, com 7 caracteres")
        return normalized


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_name: str
    user_email: str
    license_plate: str
    parking_lot_id: str
    parking_lot: ParkingLotOut
    reservation_date: date
    arrival_time: time
    duration_hours: int
    total_amount: Decimal
    status: str
    qr_code_data: str
    created_at: datetime


class HealthOut(BaseModel):
    status: str
    database: str
    environment: str

