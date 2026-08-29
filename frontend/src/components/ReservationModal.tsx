import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createReservation, qrCodeUrl } from "../services/api";
import type { ParkingLot, Reservation, ReservationPayload } from "../types";
import { CalendarIcon, CheckIcon, ClockIcon, CloseIcon } from "./Icons";

type Props = {
  parkingLot: ParkingLot;
  initialDate: string;
  initialTime: string;
  onClose: () => void;
};

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function ReservationModal({ parkingLot, initialDate, initialTime, onClose }: Props) {
  const [form, setForm] = useState<ReservationPayload>({
    user_name: "",
    user_email: "",
    license_plate: "",
    parking_lot_id: parkingLot.id,
    reservation_date: initialDate || today(),
    arrival_time: initialTime || "09:00",
    duration_hours: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const total = useMemo(
    () => Number(parkingLot.price_per_hour) * form.duration_hours,
    [parkingLot.price_per_hour, form.duration_hours],
  );

  const update = (field: keyof ReservationPayload, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      setReservation(await createReservation(form));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível confirmar a reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="reservation-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        {reservation ? (
          <div className="confirmation">
            <span className="success-icon"><CheckIcon /></span>
            <p className="eyebrow">Reserva confirmada</p>
            <h2 id="reservation-title">Sua vaga está garantida!</h2>
            <p>Apresente este QR Code na entrada do estacionamento.</p>
            <img className="qr-code" src={qrCodeUrl(reservation.id)} alt={`QR Code da reserva ${reservation.id}`} />
            <div className="confirmation-details">
              <div><span>Local</span><strong>{reservation.parking_lot.name}</strong></div>
              <div><span>Data e hora</span><strong>{new Date(`${reservation.reservation_date}T12:00:00`).toLocaleDateString("pt-BR")} · {reservation.arrival_time.slice(0, 5)}</strong></div>
              <div><span>Placa</span><strong>{reservation.license_plate}</strong></div>
              <div><span>Total</span><strong>{Number(reservation.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
            </div>
            <p className="reservation-code">Código: {reservation.id.slice(0, 8).toUpperCase()}</p>
            <button className="primary-button full" onClick={onClose}>Concluir</button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Último passo</p>
            <h2 id="reservation-title">Confirme sua reserva</h2>
            <p className="modal-subtitle">{parkingLot.name} · {parkingLot.address}</p>
            <form className="reservation-form" onSubmit={submit}>
              <div className="form-row">
                <label>Nome completo<input required minLength={2} value={form.user_name} onChange={(e) => update("user_name", e.target.value)} placeholder="Como devemos chamar você?" /></label>
                <label>E-mail<input required type="email" value={form.user_email} onChange={(e) => update("user_email", e.target.value)} placeholder="voce@email.com" /></label>
              </div>
              <label>Placa do veículo<input required minLength={7} maxLength={8} value={form.license_plate} onChange={(e) => update("license_plate", e.target.value.toUpperCase())} placeholder="ABC1D23" /></label>
              <div className="form-row">
                <label><span className="label-with-icon"><CalendarIcon />Data</span><input required type="date" min={today()} value={form.reservation_date} onChange={(e) => update("reservation_date", e.target.value)} /></label>
                <label><span className="label-with-icon"><ClockIcon />Chegada</span><input required type="time" value={form.arrival_time} onChange={(e) => update("arrival_time", e.target.value)} /></label>
              </div>
              <label>Duração<select value={form.duration_hours} onChange={(e) => update("duration_hours", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 8, 12].map((hour) => <option key={hour} value={hour}>{hour} {hour === 1 ? "hora" : "horas"}</option>)}</select></label>
              <div className="price-summary"><span>Total estimado</span><strong>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button full" disabled={loading}>{loading ? "Confirmando..." : "Confirmar e gerar QR Code"}</button>
              <p className="form-note">Nenhuma cobrança será realizada nesta demonstração.</p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

