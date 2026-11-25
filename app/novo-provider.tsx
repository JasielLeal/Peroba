"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";
import Camera from "./camera";
import NovoBoleto from "./novo-boleto";

// abrir() sem argumento abre o formulário vazio; abrir(arquivo) abre já lendo a foto/PDF do boleto;
// fotografar() abre a câmera com moldura e, ao tirar a foto, abre o formulário já lendo o boleto.
type Ctx = { abrir: (arquivo?: File) => void; fotografar: () => void };
const NovoCtx = createContext<Ctx>({ abrir: () => {}, fotografar: () => {} });
export const useNovoBoleto = () => useContext(NovoCtx);

// Mantém a folha de cadastro e o aviso de sucesso em um só lugar, acessível de qualquer tela.
export default function NovoProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState<{ arquivo: File | null } | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [camera, setCamera] = useState(false);

  const abrir = useCallback((arquivo?: File) => setAberto({ arquivo: arquivo ?? null }), []);
  const fotografar = useCallback(() => setCamera(true), []);

  useEffect(() => {
    if (!sucesso) return;
    const t = setTimeout(() => setSucesso(false), 3000);
    return () => clearTimeout(t);
  }, [sucesso]);

  return (
    <NovoCtx.Provider value={{ abrir, fotografar }}>
      {children}
      {camera && (
        <Camera
          aoFechar={() => setCamera(false)}
          aoCapturar={(arquivo) => {
            setCamera(false);
            abrir(arquivo);
          }}
        />
      )}
      {aberto && (
        <NovoBoleto
          arquivoInicial={aberto.arquivo}
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
