from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from decimal import Decimal
from io import BytesIO
from uuid import uuid4
from zoneinfo import ZoneInfo

import qrcode
import qrcode.image.svg
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from .config import Settings, get_settings
from .database import Database
from .models import ParkingLot, Reservation
from .schemas import HealthOut, ParkingLotOut, ReservationCreate, ReservationOut
from .seed import seed_parking_lots


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    database = Database(app_settings.database_url)

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        database.create_schema()
        with database.session_factory() as session:
            seed_parking_lots(session)
        application.state.database = database
        yield
        database.engine.dispose()

    application = FastAPI(
        title=app_settings.app_name,
        version="1.0.0",
        description="API de busca e reserva de vagas do Parky.",
        lifespan=lifespan,
    )
    application.state.settings = app_settings
    application.state.database = database
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    def get_session(request: Request):
        yield from request.app.state.database.session()

    @application.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"name": "Parky API", "docs": "/docs", "health": "/api/health"}

    @application.get("/api/health", response_model=HealthOut)
    def health(request: Request, session: Session = Depends(get_session)) -> HealthOut:
        try:
            session.execute(text("SELECT 1"))
        except SQLAlchemyError as exc:
            raise HTTPException(status_code=503, detail="Banco de dados indisponível") from exc
        engine_name = session.bind.dialect.name if session.bind else "unknown"
        return HealthOut(
            status="ok",
            database=engine_name,
            environment=request.app.state.settings.environment,
        )

    @application.get("/api/estacionamentos", response_model=list[ParkingLotOut])
    def list_parking_lots(
        bairro: str | None = Query(default=None, max_length=100),
        session: Session = Depends(get_session),
    ) -> list[ParkingLot]:
        statement = select(ParkingLot).order_by(ParkingLot.price_per_hour)
        if bairro:
            statement = statement.where(ParkingLot.neighborhood.ilike(f"%{bairro.strip()}%"))
        return list(session.scalars(statement))

    @application.post(
        "/api/reservas",
        response_model=ReservationOut,
        status_code=status.HTTP_201_CREATED,
    )
    def create_reservation(
        payload: ReservationCreate,
        session: Session = Depends(get_session),
    ) -> Reservation:
        app_timezone = ZoneInfo(app_settings.timezone)
        now = datetime.now(app_timezone)
        starts_at = datetime.combine(payload.reservation_date, payload.arrival_time, tzinfo=app_timezone)
        if starts_at < now - timedelta(minutes=1):
            raise HTTPException(status_code=422, detail="A reserva não pode começar no passado")

        parking_lot = session.scalar(
            select(ParkingLot)
            .where(ParkingLot.id == payload.parking_lot_id)
            .with_for_update()
        )
        if parking_lot is None:
            raise HTTPException(status_code=404, detail="Estacionamento não encontrado")

        same_day = list(
            session.scalars(
                select(Reservation).where(
                    Reservation.parking_lot_id == payload.parking_lot_id,
                    Reservation.reservation_date == payload.reservation_date,
                    Reservation.status == "confirmed",
                )
            )
        )
        ends_at = starts_at + timedelta(hours=payload.duration_hours)
        overlapping = 0
        for current in same_day:
            current_start = datetime.combine(current.reservation_date, current.arrival_time, tzinfo=app_timezone)
            current_end = current_start + timedelta(hours=current.duration_hours)
            if starts_at < current_end and ends_at > current_start:
                overlapping += 1
        if overlapping >= parking_lot.capacity:
            raise HTTPException(status_code=409, detail="Não há vagas disponíveis nesse horário")

        reservation_id = str(uuid4())
        reservation = Reservation(
            id=reservation_id,
            user_name=payload.user_name,
            user_email=str(payload.user_email),
            license_plate=payload.license_plate,
            parking_lot_id=parking_lot.id,
            reservation_date=payload.reservation_date,
            arrival_time=payload.arrival_time,
            duration_hours=payload.duration_hours,
            total_amount=(parking_lot.price_per_hour * Decimal(payload.duration_hours)).quantize(Decimal("0.01")),
            status="confirmed",
            qr_code_data=f"PARKY:{reservation_id}",
        )
        session.add(reservation)
        session.commit()
        return session.scalar(
            select(Reservation)
            .options(selectinload(Reservation.parking_lot))
            .where(Reservation.id == reservation.id)
        )

    @application.get("/api/reservas", response_model=list[ReservationOut])
    def list_reservations(
        email: str = Query(min_length=5, max_length=180),
        session: Session = Depends(get_session),
    ) -> list[Reservation]:
        statement = (
            select(Reservation)
            .options(selectinload(Reservation.parking_lot))
            .where(Reservation.user_email == email.strip().lower())
            .order_by(Reservation.reservation_date.desc(), Reservation.arrival_time.desc())
        )
        return list(session.scalars(statement))

    @application.get("/api/reservas/{reservation_id}", response_model=ReservationOut)
    def get_reservation(
        reservation_id: str,
        session: Session = Depends(get_session),
    ) -> Reservation:
        reservation = session.scalar(
            select(Reservation)
            .options(selectinload(Reservation.parking_lot))
            .where(Reservation.id == reservation_id)
        )
        if reservation is None:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        return reservation

    @application.patch("/api/reservas/{reservation_id}/cancelar", response_model=ReservationOut)
    def cancel_reservation(
        reservation_id: str,
        session: Session = Depends(get_session),
    ) -> Reservation:
        reservation = session.scalar(
            select(Reservation)
            .options(selectinload(Reservation.parking_lot))
            .where(Reservation.id == reservation_id)
        )
        if reservation is None:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        if reservation.status == "cancelled":
            return reservation
        if reservation.reservation_date < datetime.now(ZoneInfo(app_settings.timezone)).date():
            raise HTTPException(status_code=409, detail="Uma reserva passada não pode ser cancelada")
        reservation.status = "cancelled"
        session.commit()
        session.refresh(reservation)
        return reservation

    @application.get("/api/reservas/{reservation_id}/qrcode.svg")
    def reservation_qr_code(
        reservation_id: str,
        session: Session = Depends(get_session),
    ) -> Response:
        reservation = session.get(Reservation, reservation_id)
        if reservation is None:
            raise HTTPException(status_code=404, detail="Reserva não encontrada")
        qr = qrcode.make(reservation.qr_code_data, image_factory=qrcode.image.svg.SvgPathImage)
        output = BytesIO()
        qr.save(output)
        return Response(
            content=output.getvalue(),
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=3600"},
        )

    return application


app = create_app()
