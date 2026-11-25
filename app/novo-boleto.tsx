"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { CircleAlert, Info, ScanBarcode, X } from "lucide-react";
import { criarBoleto, listarFornecedores } from "./actions";
import Scanner from "./scanner";
import { formatarLinha, lerBoleto } from "@/lib/boleto";
import { CATEGORIAS, type Categoria } from "@/lib/categorias";

const vazio = { descricao: "", fornecedor: "", valor: "", vencimento: "", linha: "" };

export default function NovoBoleto({
  aoFechar,
  aoSalvar,
  escanearAoAbrir,
}: {
  aoFechar: () => void;
  aoSalvar: () => void;
  escanearAoAbrir: boolean;
}) {
  const [campos, setCampos] = useState(vazio);
  const [categoria, setCategoria] = useState<Categoria>("distribuidora");
  const [escaneando, setEscaneando] = useState(escanearAoAbrir);
  const [aviso, setAviso] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<string[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => {});
  }, []);

  const [erro, acao, pendente] = useActionState(async (prev: string | null, form: FormData) => {
    const r = await criarBoleto(prev, form);
    if (!r) aoSalvar();
    return r;
  }, null);

  // Recebe barras ou linha digitável e preenche linha, valor e vencimento.
  const preencher = useCallback((texto: string) => {
    const b = lerBoleto(texto);
    if (!b) {
      setAviso("Código inválido (dígitos não conferem). Tente escanear de novo.");
      return;
    }
    setCampos((c) => ({
      ...c,
      linha: formatarLinha(b.linha),
      valor: b.valorCentavos ? (b.valorCentavos / 100).toFixed(2).replace(".", ",") : c.valor,
      vencimento: b.vencimento ?? c.vencimento,
    }));
    setAviso(
      b.vencimento && b.valorCentavos
        ? "Código lido. Confira valor e vencimento."
        : "Código lido. Este boleto não traz " + (b.vencimento ? "valor" : "vencimento") + ": complete à mão.",
    );
  }, []);

  // Aberto direto no scanner: cancelar volta para a home. Depois da primeira leitura (ou ao
  // escanear de dentro do formulário), cancelar volta ao formulário.
  const [primeiroScan, setPrimeiroScan] = useState(escanearAoAbrir);

  const aoLer = useCallback(
    (d: string) => {
      setPrimeiroScan(false);
      setEscaneando(false);
      preencher(d);
    },
    [preencher],
  );

  const set = (k: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }));

  const rotuloFornecedor = categoria === "distribuidora" ? "Distribuidora" : categoria === "imposto" ? "Órgão / tributo (opcional)" : "Favorecido (opcional)";

  return (
    <>
      {escaneando && (
        <Scanner
          aoLer={aoLer}
          aoDigitar={() => {
            setPrimeiroScan(false);
            setEscaneando(false);
          }}
          aoFechar={() => {
            if (primeiroScan) aoFechar();
            else setEscaneando(false);
          }}
        />
      )}
      <div className="folha-fundo" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
        <div className="folha" role="dialog" aria-modal="true" aria-label="Novo boleto">
          <div className="cab">
            <h2>Novo boleto</h2>
            <button type="button" className="compacto icone sutil" aria-label="Fechar" onClick={aoFechar}>
              <X className="i" aria-hidden />
            </button>
          </div>
          <form action={acao} className="campos">
            <button type="button" onClick={() => setEscaneando(true)}>
              <ScanBarcode className="i" aria-hidden /> Escanear código de barras
            </button>
            <label>
              Linha digitável (opcional)
              <textarea
                name="linha"
                rows={2}
                inputMode="numeric"
                placeholder="Escaneie ou cole aqui"
                value={campos.linha}
                onChange={set("linha")}
                onBlur={(e) => {
                  const d = e.target.value.replace(/\D/g, "");
                  if (d.length >= 44) preencher(d);
                }}
              />
            </label>
            {aviso && (
              <p className="msg info" role="status">
                <Info className="i" aria-hidden /> {aviso}
              </p>
            )}

            <fieldset className="segmentos">
              <legend>Tipo</legend>
              {CATEGORIAS.map((c) => (
                <label key={c.id} className={categoria === c.id ? "on" : ""}>
                  <input type="radio" name="categoria" value={c.id} checked={categoria === c.id} onChange={() => setCategoria(c.id)} />
                  {c.rotulo}
                </label>
              ))}
            </fieldset>

            <label>
              {rotuloFornecedor}
              <input
                name="fornecedor"
                list="lista-fornecedores"
                placeholder={categoria === "distribuidora" ? "Ex.: Ambev" : categoria === "imposto" ? "Ex.: DAS, Prefeitura" : ""}
                required={categoria === "distribuidora"}
                autoComplete="off"
                value={campos.fornecedor}
                onChange={set("fornecedor")}
              />
              <datalist id="lista-fornecedores">
                {fornecedores.map((f) => <option key={f} value={f} />)}
              </datalist>
            </label>
            <label>
              Descrição {campos.fornecedor ? "(opcional)" : ""}
              <input name="descricao" placeholder="Ex.: NF 1234" required={!campos.fornecedor} value={campos.descricao} onChange={set("descricao")} />
            </label>
            <div className="duas">
              <label>
                Valor (R$)
                <input name="valor" inputMode="decimal" placeholder="150,00" required value={campos.valor} onChange={set("valor")} />
              </label>
              <label>
                Vencimento
                <input name="vencimento" type="date" required value={campos.vencimento} onChange={set("vencimento")} />
              </label>
            </div>
            {erro && (
              <p className="msg erro" role="alert">
                <CircleAlert className="i" aria-hidden /> {erro}
              </p>
            )}
            <button className="primario" disabled={pendente}>
              {pendente ? <span className="spin" aria-hidden /> : "Salvar boleto"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
