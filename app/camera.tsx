"use client";

import { useEffect, useRef, useState } from "react";
import { Camera as IconeCamera, Flashlight, FlashlightOff, X } from "lucide-react";

type Props = { aoCapturar: (arquivo: File) => void; aoFechar: () => void };

// Câmera própria com moldura de enquadramento (como um app de digitalização). A foto é recortada na moldura,
// o que tira o fundo e aproveita melhor os pixels para ler os números. Se a câmera não abrir (sem HTTPS,
// permissão negada), cai na câmera nativa do celular.
export default function Camera({ aoCapturar, aoFechar }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const guia = useRef<HTMLDivElement>(null);
  const trilha = useRef<MediaStreamTrack | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [temLanterna, setTemLanterna] = useState(false);
  const [lanterna, setLanterna] = useState(false);

  useEffect(() => {
    let ativo = true;
    let stream: MediaStream | null = null;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro("Não consegui abrir a câmera aqui. Use a câmera do celular.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } },
          audio: false,
        });
        if (!ativo) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const t = stream.getVideoTracks()[0];
        trilha.current = t;
        setTemLanterna(!!(t.getCapabilities?.() as { torch?: boolean } | undefined)?.torch);
        // Foco contínuo, onde o aparelho permite: números miúdos precisam de foco firme.
        t.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }).catch(() => {});
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setPronto(true);
      } catch (e) {
        const negado = (e as DOMException).name === "NotAllowedError";
        setErro(
          negado
            ? "Permissão da câmera negada. Libere nas configurações do navegador ou use a câmera do celular."
            : "Não consegui abrir a câmera. Use a câmera do celular.",
        );
      }
    })();

    return () => {
      ativo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const alternarLanterna = () => {
    const proximo = !lanterna;
    trilha.current
      ?.applyConstraints({ advanced: [{ torch: proximo } as MediaTrackConstraintSet] })
      .then(() => setLanterna(proximo))
      .catch(() => setTemLanterna(false));
  };

  const capturar = () => {
    const v = video.current;
    const a = area.current;
    const g = guia.current;
    if (!v || !a || !g || !v.videoWidth) return;

    // O vídeo é exibido com object-fit: cover; converte a moldura (em pixels da tela) para pixels do vídeo.
    const ar = a.getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    const escala = Math.max(ar.width / v.videoWidth, ar.height / v.videoHeight);
    const desX = (v.videoWidth * escala - ar.width) / 2;
    const desY = (v.videoHeight * escala - ar.height) / 2;

    let sx = (gr.left - ar.left + desX) / escala;
    let sy = (gr.top - ar.top + desY) / escala;
    let sw = gr.width / escala;
    let sh = gr.height / escala;

    // Folga de 3% para não cortar a borda do que está na moldura.
    sx -= sw * 0.03;
    sy -= sh * 0.03;
    sw *= 1.06;
    sh *= 1.06;
    sx = Math.max(0, sx);
    sy = Math.max(0, sy);
    sw = Math.min(v.videoWidth - sx, sw);
    sh = Math.min(v.videoHeight - sy, sh);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext("2d")!.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    navigator.vibrate?.(40);
    canvas.toBlob(
      (b) => b && aoCapturar(new File([b], "boleto.jpg", { type: "image/jpeg" })),
      "image/jpeg",
      0.92,
    );
  };

  if (erro) {
    return (
      <div className="camera camera-erro" role="dialog" aria-modal="true" aria-label="Câmera">
        <p>{erro}</p>
        <label className="btn primario">
          Abrir a câmera do celular
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              e.target.value = "";
              if (arquivo) aoCapturar(arquivo);
            }}
          />
        </label>
        <button type="button" onClick={aoFechar}>Cancelar</button>
      </div>
    );
  }

  return (
    <div className="camera" role="dialog" aria-modal="true" aria-label="Fotografar boleto" ref={area}>
      <video ref={video} playsInline muted />
      <div className="guia" ref={guia} aria-hidden>
        <i /><i /><i /><i />
      </div>
      <p className="dica">
        {pronto ? "Deixe o boleto inteiro dentro da moldura, reto e bem iluminado" : "Abrindo a câmera…"}
      </p>
      <div className="comandos">
        <button type="button" className="camera-btn" onClick={aoFechar} aria-label="Cancelar">
          <X aria-hidden />
        </button>
        <button type="button" className="disparo" onClick={capturar} disabled={!pronto} aria-label="Tirar foto">
          <IconeCamera aria-hidden />
        </button>
        {temLanterna ? (
          <button type="button" className="camera-btn" onClick={alternarLanterna} aria-label="Lanterna" aria-pressed={lanterna}>
            {lanterna ? <FlashlightOff aria-hidden /> : <Flashlight aria-hidden />}
          </button>
        ) : (
          <span className="camera-btn vazio-btn" />
        )}
      </div>
    </div>
  );
}
