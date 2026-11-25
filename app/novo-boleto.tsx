"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Camera as IconeCamera, CircleAlert, FileUp, Info, X } from "lucide-react";
import { criarBoleto, listarFornecedores } from "./actions";
import Camera from "./camera";
import { lerBoletoDeArquivo } from "@/lib/foto";
import { formatarLinha, lerBoleto } from "@/lib/boleto";
import { mascaraLinha, mascaraValor, valorParaInput } from "@/lib/mascaras";
import { CATEGORIAS, type Categoria } from "@/lib/categorias";

const vazio = { descricao: "", fornecedor: "", valor: "", vencimento: "", linha: "" };

export default function NovoBoleto({
  aoFechar,
  aoSalvar,
  arquivoInicial,
}: {
  aoFechar: () => void;
  aoSalvar: () => void;
  arquivoInicial: File | null;
}) {
  const [campos, setCampos] = useState(vazio);
  const [categoria, setCategoria] = useState<Categoria>("distribuidora");
  const [lendo, setLendo] = useState(false);
  const [camera, setCamera] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean }[]>([]);
  const [fornecedores, setFornecedores] = useState<string[]>([]);

  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(() => {});
  }, []);

  const [erro, acao, pendente] = useActionState(async (prev: string | null, form: FormData) => {
    const r = await criarBoleto(prev, form);
    if (!r) aoSalvar();
    return r;
  }, null);

  // Foto ou PDF -> leitura por IA (validada pelos dígitos verificadores) -> preenche o formulário.
  const lerArquivo = useCallback(async (arquivo: File) => {
    setLendo(true);
    setAviso([]);
    try {
      const r = await lerBoletoDeArquivo(arquivo);
      setCampos((c) => ({
        descricao: r.descricao ?? c.descricao,
        fornecedor: r.fornecedor ?? c.fornecedor,
        valor: r.valorCentavos ? valorParaInput(r.valorCentavos) : c.valor,
        vencimento: r.vencimento ?? c.vencimento,
        linha: r.linha ?? c.linha,
      }));
      if (r.categoria) setCategoria(r.categoria);
      setAviso([
        { texto: "Boleto lido. Confira os campos antes de salvar.", erro: false },
        ...r.avisos.map((texto) => ({ texto, erro: true })),
      ]);
    } catch (e) {
      setAviso([{ texto: (e as Error).message, erro: true }]);
    } finally {
      setLendo(false);
    }
  }, []);

  // Aberto direto pela foto do atalho "Novo boleto": já começa a ler.
  const iniciou = useRef(false);
  useEffect(() => {
    if (arquivoInicial && !iniciou.current) {
      iniciou.current = true;
      void lerArquivo(arquivoInicial);
    }
  }, [arquivoInicial, lerArquivo]);

  // Linha digitável colada à mão: valida e preenche valor/vencimento, sem IA.
  const aoColarLinha = (texto: string) => {
    const d = texto.replace(/\D/g, "");
    if (d.length < 44) return;
    const b = lerBoleto(d);
    if (!b) {
      setAviso([{ texto: "Código inválido (dígitos não conferem). Confira os números.", erro: true }]);
      return;
    }
    setCampos((c) => ({
      ...c,
      linha: formatarLinha(b.linha),
      valor: b.valorCentavos ? valorParaInput(b.valorCentavos) : c.valor,
      vencimento: b.vencimento ?? c.vencimento,
    }));
    if (b.governo) setCategoria("imposto");
    setAviso([{ texto: "Código lido. Confira valor e vencimento.", erro: false }]);
  };

  const set = (k: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }));

  const escolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (arquivo) void lerArquivo(arquivo);
  };

  const rotuloFornecedor =
    categoria === "distribuidora" ? "Distribuidora" : categoria === "imposto" ? "Órgão / tributo (opcional)" : "Favorecido (opcional)";

  return (
    <>
    {camera && (
      <Camera
        aoFechar={() => setCamera(false)}
        aoCapturar={(arquivo) => {
          setCamera(false);
          void lerArquivo(arquivo);
        }}
      />
    )}
    <div className="folha-fundo" onClick={(e) => e.target === e.currentTarget && !lendo && aoFechar()}>
      <div className="folha" role="dialog" aria-modal="true" aria-label="Novo boleto">
        <div className="cab">
          <h2>Novo boleto</h2>
          <button type="button" className="compacto icone sutil" aria-label="Fechar" onClick={aoFechar}>
            <X className="i" aria-hidden />
          </button>
        </div>

        <div className="duas leitura">
          <button type="button" className="primario" onClick={() => setCamera(true)} disabled={lendo}>
            <IconeCamera className="i" aria-hidden /> Fotografar
          </button>
          <label className="btn" aria-disabled={lendo}>
            <FileUp className="i" aria-hidden /> Foto ou PDF
            <input type="file" accept="image/*,application/pdf" onChange={escolher} disabled={lendo} hidden />
          </label>
        </div>

        {lendo && (
          <p className="msg info lendo" role="status">
            <span className="spin" aria-hidden /> Lendo o boleto… leva alguns segundos.
          </p>
        )}
        {aviso.map((a, i) => (
          <p key={i} className={`msg ${a.erro ? "erro" : "info"}`} role={a.erro ? "alert" : "status"}>
            {a.erro ? <CircleAlert className="i" aria-hidden /> : <Info className="i" aria-hidden />} {a.texto}
          </p>
        ))}

        <form action={acao} className="campos" style={{ marginTop: 14 }}>
          <label>
            Linha digitável (opcional)
            <textarea
              name="linha"
              rows={2}
              inputMode="numeric"
              placeholder="Lida da foto ou cole aqui"
              value={campos.linha}
              maxLength={60}
              onChange={(e) => setCampos((c) => ({ ...c, linha: mascaraLinha(e.target.value) }))}
              onBlur={(e) => aoColarLinha(e.target.value)}
            />
          </label>

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
              <input
                name="valor"
                inputMode="numeric"
                placeholder="0,00"
                required
                autoComplete="off"
                value={campos.valor}
                onChange={(e) => setCampos((c) => ({ ...c, valor: mascaraValor(e.target.value) }))}
              />
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
          <button className="primario" disabled={pendente || lendo}>
            {pendente ? <span className="spin" aria-hidden /> : "Salvar boleto"}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
