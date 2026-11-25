"use client";

import { useActionState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { criarFaltante } from "../actions";

export default function FormFaltante({ fornecedores }: { fornecedores: string[] }) {
  // O React 19 limpa os campos sozinho depois que a ação termina.
  const [erro, acao, pendente] = useActionState(criarFaltante, null);
  return (
    <form action={acao} className="cartao campos" aria-label="Adicionar item faltando">
      <label>
        Item que está faltando
        <input name="item" placeholder="Ex.: Refrigerante 2L" required maxLength={120} autoComplete="off" />
      </label>
      <div className="duas">
        <label>
          Quantidade (opcional)
          <input name="quantidade" placeholder="Ex.: 3 caixas" maxLength={40} autoComplete="off" />
        </label>
        <label>
          Distribuidora (opcional)
          <input name="fornecedor" list="lista-fornecedores-estoque" placeholder="Ex.: Ambev" maxLength={80} autoComplete="off" />
          <datalist id="lista-fornecedores-estoque">
            {fornecedores.map((f) => <option key={f} value={f} />)}
          </datalist>
        </label>
      </div>
      {erro && (
        <p className="msg erro" role="alert">
          <CircleAlert className="i" aria-hidden /> {erro}
        </p>
      )}
      <button className="primario" disabled={pendente}>
        {pendente ? <span className="spin" aria-hidden /> : <><Plus className="i" aria-hidden /> Adicionar à lista</>}
      </button>
    </form>
  );
}
