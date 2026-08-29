from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import ParkingLot


PARKING_LOTS = [
    {
        "name": "Parky Paulista",
        "address": "Av. Paulista, 1.378",
        "neighborhood": "Bela Vista",
        "price_per_hour": Decimal("12.00"),
        "capacity": 80,
        "image_key": "paulista",
    },
    {
        "name": "Parky Faria Lima",
        "address": "Av. Brig. Faria Lima, 2.279",
        "neighborhood": "Jardim Paulistano",
        "price_per_hour": Decimal("15.00"),
        "capacity": 60,
        "image_key": "faria-lima",
    },
    {
        "name": "Parky Vila Madalena",
        "address": "R. Harmonia, 275",
        "neighborhood": "Vila Madalena",
        "price_per_hour": Decimal("10.00"),
        "capacity": 45,
        "image_key": "vila-madalena",
    },
]


def seed_parking_lots(session: Session) -> None:
    count = session.scalar(select(func.count()).select_from(ParkingLot))
    if count:
        return
    session.add_all(ParkingLot(**parking_lot) for parking_lot in PARKING_LOTS)
    session.commit()

