import { useState } from "react";
import { CarIcon, CloseIcon, MenuIcon } from "./Icons";

type Props = {
  onMyReservations: () => void;
};

export function Header({ onMyReservations }: Props) {
  const [open, setOpen] = useState(false);

  const navigate = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate("inicio")} aria-label="Ir para o início">
        <span className="brand-mark"><CarIcon /></span>
        <span>Parky</span>
      </button>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <nav className={open ? "nav open" : "nav"} aria-label="Navegação principal">
        <button onClick={() => navigate("como-funciona")}>Como funciona</button>
        <button onClick={() => navigate("estacionamentos")}>Estacionamentos</button>
        <button onClick={() => navigate("vantagens")}>Vantagens</button>
        <button className="nav-reservations" onClick={() => { setOpen(false); onMyReservations(); }}>Minhas reservas</button>
      </nav>
    </header>
  );
}

