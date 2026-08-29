import type { ParkingLot, Reservation, ReservationPayload } from "../types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new ApiError("Não foi possível conectar ao Parky. Verifique se a API está ativa.", 0);
  }

  if (!response.ok) {
    let message = "Não foi possível concluir a operação.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
      if (Array.isArray(body.detail)) message = body.detail[0]?.msg || message;
    } catch {
      // Mantém a mensagem amigável quando a resposta não é JSON.
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export function getParkingLots(): Promise<ParkingLot[]> {
  return request("/api/estacionamentos");
}

export function createReservation(payload: ReservationPayload): Promise<Reservation> {
  return request("/api/reservas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getReservations(email: string): Promise<Reservation[]> {
  return request(`/api/reservas?email=${encodeURIComponent(email)}`);
}

export function cancelReservation(id: string): Promise<Reservation> {
  return request(`/api/reservas/${id}/cancelar`, { method: "PATCH" });
}

export function qrCodeUrl(id: string): string {
  return `${API_URL}/api/reservas/${id}/qrcode.svg`;
}

