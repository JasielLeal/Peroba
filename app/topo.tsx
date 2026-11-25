import { horaBR } from "@/lib/datas";

const PROPRIETARIO = "Kelly";

export default function Topo() {
  const h = horaBR();
  const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return (
    <header className="topo">
      <img src="/logo.png" alt="Peroba Mercadinho e Distribuidora" />
      <div className="usuario">
        <div className="saudacao">
          <small>{saudacao}</small>
          <b>{PROPRIETARIO}</b>
        </div>
        <span className="avatar" aria-hidden>{PROPRIETARIO[0]}</span>
      </div>
    </header>
  );
}
