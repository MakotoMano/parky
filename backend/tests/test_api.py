from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def make_client(tmp_path) -> TestClient:
    settings = Settings(
        database_url=f"sqlite:///{tmp_path / 'test.db'}",
        frontend_origins="http://localhost:5173",
        environment="test",
    )
    return TestClient(create_app(settings))


def test_health_and_seed(tmp_path):
    with make_client(tmp_path) as client:
        health = client.get("/api/health")
        lots = client.get("/api/estacionamentos")

    assert health.status_code == 200
    assert health.json()["database"] == "sqlite"
    assert lots.status_code == 200
    assert len(lots.json()) == 3


def test_reservation_flow(tmp_path):
    with make_client(tmp_path) as client:
        parking_lot = client.get("/api/estacionamentos").json()[0]
        payload = {
            "user_name": "Ana Silva",
            "user_email": "ANA@example.com",
            "license_plate": "abc-1d23",
            "parking_lot_id": parking_lot["id"],
            "reservation_date": str(date.today() + timedelta(days=1)),
            "arrival_time": "10:30",
            "duration_hours": 2,
        }
        created = client.post("/api/reservas", json=payload)
        assert created.status_code == 201, created.text
        body = created.json()
        assert body["license_plate"] == "ABC1D23"
        assert float(body["total_amount"]) == float(parking_lot["price_per_hour"]) * 2

        listed = client.get("/api/reservas", params={"email": "ana@example.com"})
        assert listed.status_code == 200
        assert len(listed.json()) == 1

        qr_code = client.get(f"/api/reservas/{body['id']}/qrcode.svg")
        assert qr_code.status_code == 200
        assert qr_code.headers["content-type"].startswith("image/svg+xml")

        cancelled = client.patch(f"/api/reservas/{body['id']}/cancelar")
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] == "cancelled"


def test_rejects_past_reservation(tmp_path):
    with make_client(tmp_path) as client:
        parking_lot = client.get("/api/estacionamentos").json()[0]
        response = client.post(
            "/api/reservas",
            json={
                "user_name": "Ana Silva",
                "user_email": "ana@example.com",
                "license_plate": "ABC1D23",
                "parking_lot_id": parking_lot["id"],
                "reservation_date": str(date.today() - timedelta(days=1)),
                "arrival_time": "10:30",
                "duration_hours": 1,
            },
        )
    assert response.status_code == 422
