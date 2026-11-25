import { Check, ChevronDown, Landmark, Receipt, RotateCcw, Trash2, Truck } from "lucide-react";
import type { Boleto } from "@/lib/db";
import { CATEGORIAS } from "@/lib/categorias";
import { diasEntre, formatarData, formatarDataCurta, formatarReais } from "@/lib/datas";
import { excluir, marcarPago, reabrir } from "./actions";
import CopiarLinha from "./copiar-linha";
import SubmitButton from "./submit-button";

const ICONES = { distribuidora: Truck, imposto: Landmark, outros: Receipt };

function prazo(b: Boleto, dias: number): { texto: string; tom: string } {
  if (b.status === "pago") return { texto: "Pago", tom: "ok" };
  if (dias < 0) return { texto: `Vencido há ${-dias} ${-dias === 1 ? "dia" : "dias"}`, tom: "vencido" };
  if (dias === 0) return { texto: "Vence hoje", tom: "atencao" };
  if (dias === 1) return { texto: "Vence amanhã", tom: "atencao" };
  if (dias <= 3) return { texto: `Em ${dias} dias`, tom: "atencao" };
  return { texto: formatarDataCurta(b.vencimento), tom: "" };
}

export default function ItemBoleto({ b, hoje }: { b: Boleto; hoje: string }) {
  const pago = b.status === "pago";
  const dias = diasEntre(hoje, b.vencimento);
  const p = prazo(b, dias);
  const Icone = ICONES[b.categoria];
  const rotuloCategoria = CATEGORIAS.find((c) => c.id === b.categoria)?.rotulo;
  const titulo = b.fornecedor ?? b.descricao;
  const subtitulo = b.fornecedor && b.descricao !== b.fornecedor ? `${b.descricao} · ${rotuloCategoria}` : rotuloCategoria;

  return (
    <details className="lin">
      <summary>
        <span className={`av ${b.categoria}`}><Icone aria-hidden /></span>
        <span className="tx">
          <b>{titulo}</b>
          <small>{subtitulo}</small>
        </span>
        <span className="vl">
          <b>{formatarReais(b.valor_centavos)}</b>
          <small className={p.tom}>{p.texto}</small>
        </span>
        <ChevronDown className="seta" aria-hidden />
      </summary>
      <div className="exp">
        <dl>
          <div><dt>Vencimento</dt><dd>{formatarData(b.vencimento)}</dd></div>
          <div><dt>Situação</dt><dd>{pago ? "Pago" : b.avisado_em ? "Pendente · avisado no WhatsApp" : "Pendente"}</dd></div>
        </dl>
        <div className="acoes">
          {pago ? (
            <form action={reabrir.bind(null, b.id)} className="principal">
              <SubmitButton>
                <RotateCcw className="i" aria-hidden /> Reabrir boleto
              </SubmitButton>
            </form>
          ) : (
            <form action={marcarPago.bind(null, b.id)} className="principal">
              <SubmitButton className="primario">
                <Check className="i" aria-hidden /> Marcar como pago
              </SubmitButton>
            </form>
          )}
          {b.linha_digitavel && <CopiarLinha linha={b.linha_digitavel} />}
          <form action={excluir.bind(null, b.id)} className={b.linha_digitavel ? "" : "principal"}>
            <SubmitButton className="perigo" label={`Excluir ${titulo}`}>
              <Trash2 className="i" aria-hidden /> Excluir
            </SubmitButton>
          </form>
        </div>
      </div>
    </details>
  );
}
