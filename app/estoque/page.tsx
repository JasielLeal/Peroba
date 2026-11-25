import { Check, PackageCheck, X } from "lucide-react";
import { exigirLogin } from "@/lib/auth";
import { fornecedoresConhecidos } from "@/lib/db";
import { agruparPorDistribuidora, listarFaltantes, textoDaLista, type Faltante } from "@/lib/estoque";
import { alternarFaltante, excluirFaltante } from "../actions";
import Barra from "../barra";
import SubmitButton from "../submit-button";
import Topo from "../topo";
import AcoesLista from "./acoes-lista";
import FormFaltante from "./form-faltante";

export const dynamic = "force-dynamic";

function Linha({ f }: { f: Faltante }) {
  return (
    <li className={`falt${f.comprado ? " comprado" : ""}`}>
      <form action={alternarFaltante.bind(null, f.id)}>
        <SubmitButton className="check" label={f.comprado ? `Desmarcar ${f.item}` : `Marcar ${f.item} como comprado`}>
          {f.comprado && <Check aria-hidden />}
        </SubmitButton>
      </form>
      <span className="tx">
        <b>{f.item}</b>
        {f.quantidade && <small>{f.quantidade}</small>}
      </span>
      <form action={excluirFaltante.bind(null, f.id)}>
        <SubmitButton className="compacto icone sutil" label={`Remover ${f.item}`}>
          <X className="i" aria-hidden />
        </SubmitButton>
      </form>
    </li>
  );
}

export default async function Estoque() {
  await exigirLogin();
  const [itens, fornecedores] = await Promise.all([listarFaltantes(), fornecedoresConhecidos()]);
  const comprados = itens.filter((i) => i.comprado).length;
  const faltando = itens.length - comprados;
  const grupos = agruparPorDistribuidora(itens);

  return (
    <main>
      <Topo />

      <div className="secao">
        <h2>Estoque faltante</h2>
        {itens.length > 0 && <span>{faltando} {faltando === 1 ? "item" : "itens"} para comprar</span>}
      </div>

      <FormFaltante fornecedores={fornecedores} />

      {itens.length === 0 ? (
        <div className="vazio">
          <PackageCheck aria-hidden />
          <strong>Nada faltando</strong>
          <p>Adicione acima o que acabar no estoque. Na hora das compras, marque o que já comprou.</p>
        </div>
      ) : (
        <>
          {grupos.map((g) => (
            <section key={g.nome ?? "sem"} className="cartao grupo" aria-label={g.nome ?? "Sem distribuidora"}>
              <h3>
                {g.nome ?? "Sem distribuidora"} <small>{g.itens.length} {g.itens.length === 1 ? "item" : "itens"}</small>
              </h3>
              <ul>
                {g.itens.map((f) => <Linha key={f.id} f={f} />)}
              </ul>
            </section>
          ))}
          <AcoesLista texto={textoDaLista(itens)} comprados={comprados} total={itens.length} />
        </>
      )}

      <Barra ativo="estoque" />
    </main>
  );
}
