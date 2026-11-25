"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";
import NovoBoleto from "./novo-boleto";

type Ctx = { abrir: (escanear?: boolean) => void };
const NovoCtx = createContext<Ctx>({ abrir: () => {} });
export const useNovoBoleto = () => useContext(NovoCtx);

// Mantém a folha de cadastro e o aviso de sucesso em um só lugar, acessível de qualquer tela.
export default function NovoProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState<{ escanear: boolean } | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const abrir = useCallback((escanear = false) => setAberto({ escanear }), []);

  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(() => setSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [sucesso]);

  return (
    <NovoCtx.Provider value={{ abrir }}>
      {children}
      {aberto && (
        <NovoBoleto
          escanearAoAbrir={aberto.escanear}
          aoFechar={() => setAberto(null)}
          aoSalvar={() => {
            setAberto(null);
            setSucesso(true);
          }}
        />
      )}
      {sucesso && (
        <div className="toast" role="status">
          <CircleCheck className="i" aria-hidden /> Boleto salvo
        </div>
      )}
    </NovoCtx.Provider>
  );
}
