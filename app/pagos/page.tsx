import { Receipt } from "lucide-react";
import { exigirLogin } from "@/lib/auth";
import { listarBoletos } from "@/lib/db";
import { hojeBR } from "@/lib/datas";
import Barra from "../barra";
import ItemBoleto from "../item-boleto";
import Topo from "../topo";

export const dynamic = "force-dynamic";

export default async function Pagos() {
  await exigirLogin();
  const hoje = hojeBR();
  const pagos = await listarBoletos("pago");
  return (
    <main>
      <Topo />
      <div className="secao">
        <h2>Histórico</h2>
        {pagos.length > 0 && <span>{pagos.length} {pagos.length === 1 ? "boleto" : "boletos"}</span>}
      </div>
      {pagos.length === 0 ? (
        <div className="vazio">
          <Receipt aria-hidden />
          <strong>Nenhum boleto pago ainda</strong>
          <p>Os boletos marcados como pagos aparecem aqui.</p>
        </div>
      ) : (
        <div className="painel-lista">
          {pagos.map((b) => <ItemBoleto key={b.id} b={b} hoje={hoje} />)}
        </div>
      )}
      <Barra ativo="pagos" />
    </main>
  );
}
