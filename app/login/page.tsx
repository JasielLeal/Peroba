"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { entrar } from "../actions";

export default function Login() {
  const [erro, acao, pendente] = useActionState(entrar, null);
  return (
    <div className="login">
      <div className="login-topo">
        <img src="/logo.png" alt="Peroba Mercadinho e Distribuidora" />
        <p>Controle de boletos e vencimentos</p>
      </div>
      <form action={acao} className="login-form campos">
        <h1>Entrar</h1>
        <label>
          Senha
          <input name="senha" type="password" autoComplete="current-password" required autoFocus />
        </label>
        {erro && (
          <p className="msg erro" role="alert">
            <CircleAlert className="i" aria-hidden /> {erro}
          </p>
        )}
        <button className="primario" disabled={pendente}>
          {pendente ? <span className="spin" aria-hidden /> : "Entrar"}
        </button>
      </form>
    </div>
  );
}
