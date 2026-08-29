import { useState } from "react";
import type { FormEvent } from "react";
import { cancelReservation, getReservations, qrCodeUrl } from "../services/api";
import type { Reservation } from "../types";
import { CalendarIcon, CloseIcon, SearchIcon } from "./Icons";

type Props = { onClose: () => void };

export function MyReservations({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setReservations(await getReservations(email));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível consultar as reservas.");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    if (!window.confirm("Deseja realmente cancelar esta reserva?")) return;
    try {
      const updated = await cancelReservation(id);
      setReservations((current) => current?.map((item) => item.id === id ? updated : item) ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível cancelar a reserva.");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal reservations-modal" role="dialog" aria-modal="true" aria-labelledby="my-reservations-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
        <p className="eyebrow">Área do cliente</p>
        <h2 id="my-reservations-title">Minhas reservas</h2>
        <p className="modal-subtitle">Consulte usando o mesmo e-mail informado na reserva.</p>
        <form className="search-reservations" onSubmit={search}>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" aria-label="E-mail da reserva" />
          <button className="primary-button" disabled={loading}><SearchIcon />{loading ? "Buscando..." : "Buscar"}</button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="reservation-list">
          {reservations?.length === 0 && <div className="empty-state"><CalendarIcon /><h3>Nenhuma reserva encontrada</h3><p>Confira o e-mail ou faça sua primeira reserva.</p></div>}
          {reservations?.map((reservation) => (
            <article className="reservation-item" key={reservation.id}>
              <img src={qrCodeUrl(reservation.id)} alt="QR Code da reserva" />
              <div className="reservation-main">
                <div className="reservation-title-row"><h3>{reservation.parking_lot.name}</h3><span className={`status ${reservation.status}`}>{reservation.status === "confirmed" ? "Confirmada" : "Cancelada"}</span></div>
                <p>{new Date(`${reservation.reservation_date}T12:00:00`).toLocaleDateString("pt-BR")} às {reservation.arrival_time.slice(0, 5)} · {reservation.duration_hours}h</p>
                <p>Placa {reservation.license_plate} · <strong>{Number(reservation.total_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></p>
                {reservation.status === "confirmed" && <button className="text-button danger" onClick={() => cancel(reservation.id)}>Cancelar reserva</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

