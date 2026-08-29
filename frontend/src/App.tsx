import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Header } from "./components/Header";
import { ArrowIcon, CalendarIcon, CarIcon, CheckIcon, ClockIcon, PinIcon, SearchIcon, ShieldIcon } from "./components/Icons";
import { MyReservations } from "./components/MyReservations";
import { ReservationModal } from "./components/ReservationModal";
import { getParkingLots } from "./services/api";
import type { ParkingLot } from "./types";

function localDate(daysAhead = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function App() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(localDate(1));
  const [time, setTime] = useState("09:00");
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [showReservations, setShowReservations] = useState(false);

  useEffect(() => {
    getParkingLots()
      .then(setLots)
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredLots = useMemo(() => {
    const query = location.trim().toLowerCase();
    if (!query) return lots;
    return lots.filter((lot) => `${lot.name} ${lot.neighborhood} ${lot.address}`.toLowerCase().includes(query));
  }, [location, lots]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    document.getElementById("estacionamentos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Header onMyReservations={() => setShowReservations(true)} />
      <main>
        <section className="hero" id="inicio">
          <div className="hero-glow one" />
          <div className="hero-glow two" />
          <div className="hero-content">
            <span className="hero-badge"><span /> Estacione com inteligência</span>
            <h1>Sua vaga garantida.<br /><em>Sem dar voltas.</em></h1>
            <p>Encontre, reserve e estacione nos melhores pontos de São Paulo. Mais tempo para você, menos tempo no trânsito.</p>
            <form className="search-box" onSubmit={search}>
              <label><span><PinIcon />Onde você vai?</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bairro ou endereço" /></label>
              <label><span><CalendarIcon />Data</span><input type="date" min={localDate()} value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label><span><ClockIcon />Horário</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
              <button className="search-button"><SearchIcon /><span>Buscar vagas</span></button>
            </form>
            <div className="hero-proof"><div className="avatars"><span>MA</span><span>JP</span><span>LS</span></div><p><strong>+2.500 motoristas</strong><br />já estacionam sem estresse</p><div className="stars">★★★★★</div></div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="road-lines" />
            <div className="phone-card">
              <div className="phone-top"><span className="phone-logo"><CarIcon /></span><b>Parky</b><span className="phone-avatar">DS</span></div>
              <p>Olá! 👋</p><h3>Onde vamos estacionar?</h3>
              <div className="mini-map"><div className="map-street a"/><div className="map-street b"/><div className="map-street c"/><span className="map-pin"><PinIcon /></span></div>
              <div className="mini-lot"><span className="mini-photo"/><div><b>Parky Paulista</b><small>3 min · 12 vagas</small></div><strong>R$ 12<small>/h</small></strong></div>
              <div className="mini-button">Reservar agora</div>
            </div>
            <div className="floating-card available"><span><CheckIcon /></span><div><b>Vaga disponível</b><small>a 280 metros</small></div></div>
            <div className="floating-card time-saved"><ClockIcon /><div><b>15 min</b><small>economizados hoje</small></div></div>
          </div>
        </section>

        <section className="section how" id="como-funciona">
          <div className="section-heading"><p className="eyebrow">Simples do início ao fim</p><h2>Estacionar nunca foi tão fácil</h2><p>Três passos e sua vaga está garantida.</p></div>
          <div className="steps">
            <article><span className="step-number">01</span><div className="step-icon"><SearchIcon /></div><h3>Encontre</h3><p>Busque estacionamentos próximos ao seu destino e compare as opções.</p></article>
            <span className="step-line"><ArrowIcon /></span>
            <article><span className="step-number">02</span><div className="step-icon"><CalendarIcon /></div><h3>Reserve</h3><p>Escolha o horário e garanta sua vaga em poucos segundos.</p></article>
            <span className="step-line"><ArrowIcon /></span>
            <article><span className="step-number">03</span><div className="step-icon"><CarIcon /></div><h3>Estacione</h3><p>Apresente o QR Code na entrada e aproveite seu tempo.</p></article>
          </div>
        </section>

        <section className="section lots-section" id="estacionamentos">
          <div className="section-heading left"><div><p className="eyebrow">Perto de onde importa</p><h2>Estacionamentos disponíveis</h2></div><p>Valores transparentes, locais selecionados e reserva imediata.</p></div>
          {loadError && <p className="load-error">{loadError}</p>}
          <div className="lot-grid">
            {loading && [1,2,3].map((item) => <div className="lot-card skeleton" key={item} />)}
            {!loading && filteredLots.length === 0 && <div className="no-results"><SearchIcon /><h3>Nenhum local encontrado</h3><p>Tente buscar por Paulista, Faria Lima ou Vila Madalena.</p></div>}
            {filteredLots.map((lot) => (
              <article className="lot-card" key={lot.id}>
                <div className={`lot-image ${lot.image_key}`}><span className="availability"><i /> Vagas disponíveis</span><span className="distance">até {lot.capacity} vagas</span></div>
                <div className="lot-content"><p className="lot-neighborhood">{lot.neighborhood}</p><h3>{lot.name}</h3><p className="lot-address"><PinIcon />{lot.address}</p><div className="lot-footer"><p><strong>{Number(lot.price_per_hour).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><span>/ hora</span></p><button className="secondary-button" onClick={() => setSelectedLot(lot)}>Reservar <ArrowIcon /></button></div></div>
              </article>
            ))}
          </div>
        </section>

        <section className="benefits" id="vantagens">
          <div className="benefit-copy"><p className="eyebrow light">Feito para a vida real</p><h2>Menos trânsito.<br />Mais vida.</h2><p>O tempo que você perde procurando uma vaga pode virar café, conversa ou simplesmente tranquilidade.</p><div className="benefit-list"><div><span><ClockIcon /></span><p><strong>Economize até 20 minutos</strong><small>por viagem, todos os dias</small></p></div><div><span><ShieldIcon /></span><p><strong>Locais verificados</strong><small>para você estacionar com segurança</small></p></div><div><span><CheckIcon /></span><p><strong>Preço sem surpresa</strong><small>você sabe quanto vai pagar antes</small></p></div></div></div>
          <div className="stat-panel"><div className="stat-main"><strong>42h</strong><span>tempo médio economizado<br />por motorista ao ano</span></div><div className="stat-row"><div><strong>4,9</strong><span>avaliação média</span></div><div><strong>98%</strong><span>recomendam</span></div></div><div className="quote">“Chego no horário e sem estresse. Virou essencial na minha rotina.”<span>— Marina, cliente Parky</span></div></div>
        </section>

        <section className="cta-section"><div><p className="eyebrow">Sua próxima vaga está aqui</p><h2>Pronto para parar de procurar?</h2><p>Reserve agora e chegue ao seu destino com a tranquilidade que você merece.</p></div><button className="primary-button cta-button" onClick={() => document.getElementById("estacionamentos")?.scrollIntoView({ behavior: "smooth" })}>Encontrar uma vaga <ArrowIcon /></button></section>
      </main>
      <footer><div className="brand footer-brand"><span className="brand-mark"><CarIcon /></span><span>Parky</span></div><p>© 2026 Parky. Sua vaga, sem voltas.</p><button onClick={() => setShowReservations(true)}>Minhas reservas</button></footer>
      {selectedLot && <ReservationModal parkingLot={selectedLot} initialDate={date} initialTime={time} onClose={() => setSelectedLot(null)} />}
      {showReservations && <MyReservations onClose={() => setShowReservations(false)} />}
    </>
  );
}

